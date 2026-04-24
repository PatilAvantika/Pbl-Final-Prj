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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatbotController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const client_1 = require("@prisma/client");
const roles_guard_1 = require("../auth/roles.guard");
const chatbot_service_1 = require("./chatbot.service");
const chatbot_ai_service_1 = require("./chatbot-ai.service");
const chatbot_query_dto_1 = require("./dto/chatbot-query.dto");
const IMPERSONATION_ROLES = [client_1.Role.SUPER_ADMIN, client_1.Role.NGO_ADMIN, client_1.Role.HR_MANAGER];
let ChatbotController = class ChatbotController {
    chatbotService;
    chatbotAiService;
    constructor(chatbotService, chatbotAiService) {
        this.chatbotService = chatbotService;
        this.chatbotAiService = chatbotAiService;
    }
    async query(req, dto) {
        try {
            const { message } = dto;
            console.log("Incoming message:", message);
            console.log("AI key exists:", !!process.env.OPENAI_API_KEY);
            if (!message) {
                return {
                    reply: "Please enter a message",
                    source: "error"
                };
            }
            if (dto.user_id && dto.user_id !== req.user.id) {
                if (!IMPERSONATION_ROLES.includes(req.user.role)) {
                    throw new common_1.ForbiddenException('Cannot query on behalf of another user');
                }
            }
            const effectiveUserId = dto.user_id && IMPERSONATION_ROLES.includes(req.user.role) ? dto.user_id : req.user.id;
            if (process.env.OPENAI_API_KEY) {
                try {
                    const aiResponse = await this.chatbotAiService.generateAIResponse(message, effectiveUserId, req.user.role, req.user.organizationId);
                    return aiResponse;
                }
                catch (aiError) {
                    console.error("AI ERROR:", aiError.message);
                }
            }
            const ruleResponse = await this.chatbotService.handleQuery(message, effectiveUserId, req.user.role, req.user.organizationId);
            return { ...ruleResponse, source: 'rule' };
        }
        catch (error) {
            console.error("CHATBOT CONTROLLER ERROR:", error);
            return {
                reply: "Something went wrong. Please try again.",
                source: "error"
            };
        }
    }
    async ai(req, dto) {
        const effectiveUserId = this.chatbotAiService.resolveEffectiveUserId(dto.user_id, req.user.id, req.user.role);
        try {
            return await this.chatbotAiService.generateAIResponse(dto.message, effectiveUserId, req.user.role, req.user.organizationId);
        }
        catch (error) {
            console.error("AI endpoint failed:", error);
            return { reply: "Something went wrong. Please try again.", source: "error" };
        }
    }
};
exports.ChatbotController = ChatbotController;
__decorate([
    (0, common_1.Post)('query'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, chatbot_query_dto_1.ChatbotQueryDto]),
    __metadata("design:returntype", Promise)
], ChatbotController.prototype, "query", null);
__decorate([
    (0, common_1.Post)('ai'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, chatbot_query_dto_1.ChatbotQueryDto]),
    __metadata("design:returntype", Promise)
], ChatbotController.prototype, "ai", null);
exports.ChatbotController = ChatbotController = __decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, common_1.Controller)('chatbot'),
    __metadata("design:paramtypes", [chatbot_service_1.ChatbotService,
        chatbot_ai_service_1.ChatbotAiService])
], ChatbotController);
//# sourceMappingURL=chatbot.controller.js.map