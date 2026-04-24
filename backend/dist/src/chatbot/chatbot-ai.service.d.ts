import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DecisionIntelligenceService } from '../analytics/decision-intelligence.service';
import { ChatbotService } from './chatbot.service';
export type ChatbotAiResult = {
    reply: string;
    data?: Record<string, unknown>;
    actions?: string[];
    source: 'ai' | 'fallback';
};
export declare class ChatbotAiService {
    private readonly prisma;
    private readonly decision;
    private readonly ruleChatbot;
    private readonly logger;
    private openai;
    constructor(prisma: PrismaService, decision: DecisionIntelligenceService, ruleChatbot: ChatbotService);
    private buildContext;
    generateAIResponse(message: string, effectiveUserId: string, actorRole: Role, organizationId: string | undefined): Promise<ChatbotAiResult>;
    resolveEffectiveUserId(dtoUserId: string | undefined, actorId: string, actorRole: Role): string;
}
