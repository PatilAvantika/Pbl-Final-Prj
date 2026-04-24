import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DecisionIntelligenceService } from '../analytics/decision-intelligence.service';
import { ChatbotService } from './chatbot.service';
import OpenAI from 'openai';

const IMPERSONATION_ROLES: Role[] = [Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.HR_MANAGER];

export type ChatbotAiResult = {
  reply: string;
  data?: Record<string, unknown>;
  actions?: string[];
  source: 'ai' | 'fallback';
};

/**
 * Generative assistant: calls OpenAI when configured; otherwise delegates to rule-based chatbot.
 */
@Injectable()
export class ChatbotAiService {
  private readonly logger = new Logger(ChatbotAiService.name);
  private openai: OpenAI | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly decision: DecisionIntelligenceService,
    private readonly ruleChatbot: ChatbotService,
  ) {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  private async buildContext(userId: string, organizationId: string | undefined): Promise<string> {
    if (!organizationId) return 'No organization context.';
    const tasks = await this.prisma.taskAssignment.findMany({
      where: { userId, task: { organizationId } },
      take: 6,
      orderBy: { task: { startTime: 'desc' } },
      select: { task: { select: { title: true, lifecycleStatus: true, startTime: true } } },
    });
    const rel = await this.decision.computeReliability(userId, organizationId);
    const abs = await this.decision.countAbsenceEvents(userId, organizationId);
    const lines = [
      `Reliability index: ${rel.reliability_score} (${rel.category}).`,
      `Absence-like events (7d heuristic): ${abs}.`,
      `Recent tasks: ${tasks.map((t) => t.task.title).join('; ') || 'none listed'}.`,
    ];
    return lines.join('\n');
  }

  async generateAIResponse(
    message: string,
    effectiveUserId: string,
    actorRole: Role,
    organizationId: string | undefined,
  ): Promise<ChatbotAiResult> {
    try {
      if (!this.openai) {
        throw new Error('OpenAI client not initialized');
      }

      const ctx = await this.buildContext(effectiveUserId, organizationId);
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an NGO field operations copilot. Answer using the context only; if data is missing, say so. Short paragraphs. No hallucinated policies.',
          },
          {
            role: 'user',
            content: `User question:\n${message}\n\nContext:\n${ctx}`,
          },
        ],
        max_tokens: 600,
        temperature: 0.4,
      });

      return {
        reply: response?.choices?.[0]?.message?.content || 'No response',
        source: 'ai',
      };
    } catch (e) {
      console.error('OPENAI ERROR:', e);
      throw new Error('AI failed');
    }
  }

  resolveEffectiveUserId(dtoUserId: string | undefined, actorId: string, actorRole: Role): string {
    if (!dtoUserId || dtoUserId === actorId) return actorId;
    if (!IMPERSONATION_ROLES.includes(actorRole)) {
      throw new ForbiddenException('Cannot query on behalf of another user');
    }
    return dtoUserId;
  }
}
