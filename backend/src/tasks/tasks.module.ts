import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { AdminTasksController } from '../admin/admin-tasks.controller';
import { AdminTasksService } from '../admin/admin-tasks.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { FieldOpsModule } from '../field-ops/field-ops.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [PrismaModule, AuditModule, FieldOpsModule, AnalyticsModule],
  controllers: [TasksController, AdminTasksController],
  providers: [TasksService, AdminTasksService],
  exports: [TasksService],
})
export class TasksModule {}
