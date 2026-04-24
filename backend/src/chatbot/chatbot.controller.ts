import { Body, Controller, ForbiddenException, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { RolesGuard } from '../auth/roles.guard';
import { ChatbotService } from './chatbot.service';
import { ChatbotAiService } from './chatbot-ai.service';
import { ChatbotQueryDto } from './dto/chatbot-query.dto';

const IMPERSONATION_ROLES: Role[] = [Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.HR_MANAGER];

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('chatbot')
export class ChatbotController {
  constructor(
    private readonly chatbotService: ChatbotService,
    private readonly chatbotAiService: ChatbotAiService,
  ) {}

  @Post('query')
  async query(@Request() req: { user: { id: string; role: Role; organizationId?: string } }, @Body() dto: ChatbotQueryDto) {
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
          throw new ForbiddenException('Cannot query on behalf of another user');
        }
      }
      const effectiveUserId = dto.user_id && IMPERSONATION_ROLES.includes(req.user.role) ? dto.user_id : req.user.id;

      // Try AI first
      if (process.env.OPENAI_API_KEY) {
        try {
          const aiResponse = await this.chatbotAiService.generateAIResponse(
            message,
            effectiveUserId,
            req.user.role,
            req.user.organizationId
          );
          return aiResponse;
        } catch (aiError) {
          console.error("AI ERROR:", (aiError as Error).message);
        }
      }

      // Fallback
      const ruleResponse = await this.chatbotService.handleQuery(
        message,
        effectiveUserId,
        req.user.role,
        req.user.organizationId
      );
      
      return { ...ruleResponse, source: 'rule' };
    } catch (error) {
      console.error("CHATBOT CONTROLLER ERROR:", error);
      return {
        reply: "Something went wrong. Please try again.",
        source: "error"
      };
    }
  }

  /** Generative assistant (OpenAI when configured); always safe — falls back to rule engine. */
  @Post('ai')
  async ai(@Request() req: { user: { id: string; role: Role; organizationId?: string } }, @Body() dto: ChatbotQueryDto) {
    const effectiveUserId = this.chatbotAiService.resolveEffectiveUserId(dto.user_id, req.user.id, req.user.role);
    try {
      return await this.chatbotAiService.generateAIResponse(dto.message, effectiveUserId, req.user.role, req.user.organizationId);
    } catch (error) {
      console.error("AI endpoint failed:", error);
      return { reply: "Something went wrong. Please try again.", source: "error" };
    }
  }
}
