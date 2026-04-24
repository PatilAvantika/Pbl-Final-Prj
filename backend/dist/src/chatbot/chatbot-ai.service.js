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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var ChatbotAiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatbotAiService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const decision_intelligence_service_1 = require("../analytics/decision-intelligence.service");
const chatbot_service_1 = require("./chatbot.service");
const openai_1 = __importDefault(require("openai"));
const IMPERSONATION_ROLES = [client_1.Role.SUPER_ADMIN, client_1.Role.NGO_ADMIN, client_1.Role.HR_MANAGER];
let ChatbotAiService = ChatbotAiService_1 = class ChatbotAiService {
    prisma;
    decision;
    ruleChatbot;
    logger = new common_1.Logger(ChatbotAiService_1.name);
    openai = null;
    constructor(prisma, decision, ruleChatbot) {
        this.prisma = prisma;
        this.decision = decision;
        this.ruleChatbot = ruleChatbot;
        if (process.env.OPENAI_API_KEY) {
            this.openai = new openai_1.default({
                apiKey: process.env.OPENAI_API_KEY,
            });
        }
    }
    async buildContext(userId, organizationId) {
        if (!organizationId)
            return 'No organization context.';
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
    async generateAIResponse(message, effectiveUserId, actorRole, organizationId) {
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
                        content: 'You are an NGO field operations copilot. Answer using the context only; if data is missing, say so. Short paragraphs. No hallucinated policies.',
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
        }
        catch (e) {
            console.error('OPENAI ERROR:', e);
            throw new Error('AI failed');
        }
    }
    resolveEffectiveUserId(dtoUserId, actorId, actorRole) {
        if (!dtoUserId || dtoUserId === actorId)
            return actorId;
        if (!IMPERSONATION_ROLES.includes(actorRole)) {
            throw new common_1.ForbiddenException('Cannot query on behalf of another user');
        }
        return dtoUserId;
    }
};
exports.ChatbotAiService = ChatbotAiService;
exports.ChatbotAiService = ChatbotAiService = ChatbotAiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        decision_intelligence_service_1.DecisionIntelligenceService,
        chatbot_service_1.ChatbotService])
], ChatbotAiService);
//# sourceMappingURL=chatbot-ai.service.js.map