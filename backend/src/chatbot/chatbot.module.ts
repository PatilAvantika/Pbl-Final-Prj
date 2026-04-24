import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { ChatbotAiService } from './chatbot-ai.service';

@Module({
  imports: [PrismaModule, AnalyticsModule],
  controllers: [ChatbotController],
  providers: [ChatbotService, ChatbotAiService],
})
export class ChatbotModule {}
