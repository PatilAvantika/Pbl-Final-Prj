import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DecisionIntelligenceService } from './decision-intelligence.service';
import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AnalyticsController],
  providers: [DecisionIntelligenceService],
  exports: [DecisionIntelligenceService],
})
export class AnalyticsModule {}
