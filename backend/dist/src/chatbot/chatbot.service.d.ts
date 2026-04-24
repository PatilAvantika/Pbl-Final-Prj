import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DecisionIntelligenceService } from '../analytics/decision-intelligence.service';
export type ChatbotQueryResult = {
    reply: string;
    data?: Record<string, unknown>;
    actions?: string[];
};
export declare class ChatbotService {
    private readonly prisma;
    private readonly decision;
    constructor(prisma: PrismaService, decision: DecisionIntelligenceService);
    handleQuery(message: string, actorId: string, actorRole: Role, organizationId: string | undefined): Promise<ChatbotQueryResult>;
}
