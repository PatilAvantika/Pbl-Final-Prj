import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TasksModule } from '../tasks/tasks.module';
import { AuditModule } from '../audit/audit.module';
import { DonorModule } from '../donor/donor.module';

@Module({
  imports: [PrismaModule, TasksModule, AuditModule, DonorModule],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule { }
