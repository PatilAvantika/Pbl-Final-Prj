import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { TasksModule } from '../tasks/tasks.module';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { ReportSummaryService } from './report-summary.service';

@Module({
  imports: [PrismaModule, AnalyticsModule, TasksModule],
  controllers: [AiController],
  providers: [AiService, ReportSummaryService],
  exports: [AiService, ReportSummaryService],
})
export class AiModule {}
