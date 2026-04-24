import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DecisionIntelligenceService } from '../analytics/decision-intelligence.service';
import { fetchWithTimeout } from './ai-http.util';

export type AiReliabilityCategory = 'low' | 'medium' | 'high';

export type AiReliabilityResponse = {
  worker_id: string;
  ai_score: number;
  category: AiReliabilityCategory;
  source: 'ai' | 'fallback';
};

export type AiTaskSuggestionsResponse = {
  task_id: string;
  suggestions: import('../analytics/decision-intelligence.service').WorkerSuggestion[];
  source: 'ai' | 'fallback';
};

function ruleCategoryToAi(cat: 'reliable' | 'average' | 'at_risk'): AiReliabilityCategory {
  if (cat === 'reliable') return 'high';
  if (cat === 'average') return 'medium';
  return 'low';
}

function normalizeAiCategory(c: unknown): AiReliabilityCategory {
  const s = String(c ?? '').toLowerCase();
  if (s === 'high' || s === 'medium' || s === 'low') return s;
  return 'medium';
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly aiBaseUrl: string;

  constructor(private readonly decision: DecisionIntelligenceService) {
    this.aiBaseUrl = (process.env.AI_SERVICE_URL || 'http://localhost:8000').replace(/\/$/, '');
  }

  /**
   * GET /ai/reliability — tries Python microservice; never throws for AI down (uses rule-based snapshot).
   */
  async predictReliability(workerId: string, organizationId: string): Promise<AiReliabilityResponse> {
    await this.decision.assertWorkerInOrganization(workerId, organizationId);
    const rule = await this.decision.computeReliability(workerId, organizationId);
    const absencesLast7 = await this.decision.countAbsenceEvents(workerId, organizationId);

    const payload = {
      attendance_rate: rule.attendance_rate,
      task_completion_rate: rule.task_completion_rate,
      report_approval_rate: rule.report_approval_rate,
      absences_last_7_days: absencesLast7,
    };

    try {
      const res = await fetchWithTimeout(`${this.aiBaseUrl}/predict/reliability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        timeoutMs: 6000,
      });
      if (!res.ok) throw new Error(`AI HTTP ${res.status}`);
      const j = (await res.json()) as { ai_score?: number; category?: string };
      if (typeof j.ai_score !== 'number' || !Number.isFinite(j.ai_score)) {
        throw new Error('Invalid AI payload');
      }
      return {
        worker_id: workerId,
        ai_score: Math.min(1, Math.max(0, j.ai_score)),
        category: normalizeAiCategory(j.category),
        source: 'ai',
      };
    } catch (e) {
      this.logger.warn(`AI reliability unavailable, using rule snapshot: ${(e as Error).message}`);
      return {
        worker_id: workerId,
        ai_score: rule.reliability_score,
        category: ruleCategoryToAi(rule.category),
        source: 'fallback',
      };
    }
  }

  /**
   * GET /ai/task-suggestions — tries Python ranking; falls back to existing decision layer.
   */
  async predictTaskSuggestions(taskId: string, organizationId: string): Promise<AiTaskSuggestionsResponse> {
    const fallback = await this.decision.suggestWorkersForTask(taskId, organizationId);
    if (fallback.length === 0) {
      return { task_id: taskId, suggestions: [], source: 'fallback' };
    }

    try {
      const res = await fetchWithTimeout(`${this.aiBaseUrl}/predict/task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: taskId,
          candidates: fallback.map((c) => ({
            worker_id: c.worker_id,
            worker_name: c.worker_name,
            score: c.score,
            reliability_score: c.reliability_score,
            distance_score: c.distance_score,
            workload_score: c.workload_score,
          })),
        }),
        timeoutMs: 8000,
      });
      if (!res.ok) throw new Error(`AI HTTP ${res.status}`);
      const j = (await res.json()) as { ranked?: Array<{ worker_id: string; score?: number }> };
      const ranked = Array.isArray(j.ranked) ? j.ranked : [];
      const byId = new Map(fallback.map((x) => [x.worker_id, x]));
      const merged = ranked
        .map((r) => {
          const base = byId.get(r.worker_id);
          if (!base) return null;
          const sc = typeof r.score === 'number' && Number.isFinite(r.score) ? r.score : base.score;
          return { ...base, score: Math.round(sc * 1000) / 1000 };
        })
        .filter((x): x is NonNullable<typeof x> => x != null)
        .slice(0, 3);
      if (merged.length === 0) throw new Error('Empty AI ranking');
      return { task_id: taskId, suggestions: merged, source: 'ai' };
    } catch (e) {
      this.logger.warn(`AI task suggestions unavailable, using rule layer: ${(e as Error).message}`);
      return { task_id: taskId, suggestions: fallback, source: 'fallback' };
    }
  }
}
