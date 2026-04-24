import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OpenTaskAssignmentStrategy } from './domain/task-assignment/open-task.strategy';
import { BulkTaskAssignmentStrategy } from './domain/task-assignment/bulk-task.strategy';
import { TaskAssignmentOrchestratorService } from './services/task-assignment-orchestrator.service';
import { TaskLifecycleService } from './services/task-lifecycle.service';

@Module({
    imports: [PrismaModule],
    providers: [
        OpenTaskAssignmentStrategy,
        BulkTaskAssignmentStrategy,
        TaskAssignmentOrchestratorService,
        TaskLifecycleService,
    ],
    exports: [TaskAssignmentOrchestratorService, TaskLifecycleService],
})
export class FieldOpsModule {}
