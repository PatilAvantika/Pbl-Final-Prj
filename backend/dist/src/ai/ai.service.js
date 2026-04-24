"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const decision_intelligence_service_1 = require("../analytics/decision-intelligence.service");
const ai_http_util_1 = require("./ai-http.util");
function ruleCategoryToAi(cat) {
    if (cat === 'reliable')
        return 'high';
    if (cat === 'average')
        return 'medium';
    return 'low';
}
function normalizeAiCategory(c) {
    const s = String(c ?? '').toLowerCase();
    if (s === 'high' || s === 'medium' || s === 'low')
        return s;
    return 'medium';
}
let AiService = AiService_1 = class AiService {
    decision;
    logger = new common_1.Logger(AiService_1.name);
    aiBaseUrl;
    constructor(decision) {
        this.decision = decision;
        this.aiBaseUrl = (process.env.AI_SERVICE_URL || 'http://localhost:8000').replace(/\/$/, '');
    }
    async predictReliability(workerId, organizationId) {
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
            const res = await (0, ai_http_util_1.fetchWithTimeout)(`${this.aiBaseUrl}/predict/reliability`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                timeoutMs: 6000,
            });
            if (!res.ok)
                throw new Error(`AI HTTP ${res.status}`);
            const j = (await res.json());
            if (typeof j.ai_score !== 'number' || !Number.isFinite(j.ai_score)) {
                throw new Error('Invalid AI payload');
            }
            return {
                worker_id: workerId,
                ai_score: Math.min(1, Math.max(0, j.ai_score)),
                category: normalizeAiCategory(j.category),
                source: 'ai',
            };
        }
        catch (e) {
            this.logger.warn(`AI reliability unavailable, using rule snapshot: ${e.message}`);
            return {
                worker_id: workerId,
                ai_score: rule.reliability_score,
                category: ruleCategoryToAi(rule.category),
                source: 'fallback',
            };
        }
    }
    async predictTaskSuggestions(taskId, organizationId) {
        const fallback = await this.decision.suggestWorkersForTask(taskId, organizationId);
        if (fallback.length === 0) {
            return { task_id: taskId, suggestions: [], source: 'fallback' };
        }
        try {
            const res = await (0, ai_http_util_1.fetchWithTimeout)(`${this.aiBaseUrl}/predict/task`, {
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
            if (!res.ok)
                throw new Error(`AI HTTP ${res.status}`);
            const j = (await res.json());
            const ranked = Array.isArray(j.ranked) ? j.ranked : [];
            const byId = new Map(fallback.map((x) => [x.worker_id, x]));
            const merged = ranked
                .map((r) => {
                const base = byId.get(r.worker_id);
                if (!base)
                    return null;
                const sc = typeof r.score === 'number' && Number.isFinite(r.score) ? r.score : base.score;
                return { ...base, score: Math.round(sc * 1000) / 1000 };
            })
                .filter((x) => x != null)
                .slice(0, 3);
            if (merged.length === 0)
                throw new Error('Empty AI ranking');
            return { task_id: taskId, suggestions: merged, source: 'ai' };
        }
        catch (e) {
            this.logger.warn(`AI task suggestions unavailable, using rule layer: ${e.message}`);
            return { task_id: taskId, suggestions: fallback, source: 'fallback' };
        }
    }
};
exports.AiService = AiService;
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [decision_intelligence_service_1.DecisionIntelligenceService])
], AiService);
//# sourceMappingURL=ai.service.js.map