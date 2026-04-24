import { Role } from '@prisma/client';
import { ChatbotService } from './chatbot.service';
import { ChatbotAiService } from './chatbot-ai.service';
import { ChatbotQueryDto } from './dto/chatbot-query.dto';
export declare class ChatbotController {
    private readonly chatbotService;
    private readonly chatbotAiService;
    constructor(chatbotService: ChatbotService, chatbotAiService: ChatbotAiService);
    query(req: {
        user: {
            id: string;
            role: Role;
            organizationId?: string;
        };
    }, dto: ChatbotQueryDto): Promise<{
        source: string;
        reply: string;
        data?: Record<string, unknown>;
        actions?: string[];
    }>;
    ai(req: {
        user: {
            id: string;
            role: Role;
            organizationId?: string;
        };
    }, dto: ChatbotQueryDto): Promise<import("./chatbot-ai.service").ChatbotAiResult | {
        reply: string;
        source: string;
    }>;
}
