import type { AssignmentContext, AssignmentMode, AssignmentResult } from '../domain/task-assignment/assignment-strategy.interface';
import { OpenTaskAssignmentStrategy } from '../domain/task-assignment/open-task.strategy';
import { BulkTaskAssignmentStrategy } from '../domain/task-assignment/bulk-task.strategy';
export declare class TaskAssignmentOrchestratorService {
    private readonly openStrategy;
    private readonly bulkStrategy;
    constructor(openStrategy: OpenTaskAssignmentStrategy, bulkStrategy: BulkTaskAssignmentStrategy);
    assign(mode: AssignmentMode, ctx: AssignmentContext): Promise<AssignmentResult>;
}
