import { BadRequestException, Injectable } from '@nestjs/common';
import type { AssignmentContext, AssignmentMode, AssignmentResult } from '../domain/task-assignment/assignment-strategy.interface';
import { OpenTaskAssignmentStrategy } from '../domain/task-assignment/open-task.strategy';
import { BulkTaskAssignmentStrategy } from '../domain/task-assignment/bulk-task.strategy';

@Injectable()
export class TaskAssignmentOrchestratorService {
    constructor(
        private readonly openStrategy: OpenTaskAssignmentStrategy,
        private readonly bulkStrategy: BulkTaskAssignmentStrategy,
    ) {}

    async assign(mode: AssignmentMode, ctx: AssignmentContext): Promise<AssignmentResult> {
        const strategy = mode === 'open' ? this.openStrategy : mode === 'bulk' ? this.bulkStrategy : null;
        if (!strategy) {
            throw new BadRequestException('Invalid assignment mode (use open or bulk)');
        }
        return strategy.assign(ctx);
    }
}
