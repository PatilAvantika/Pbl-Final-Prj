export type AssignmentMode = 'open' | 'bulk';
export interface AssignmentContext {
    taskId: string;
    leaderId: string;
    organizationId: string;
    userIds?: string[];
}
export interface AssignmentResult {
    assignedCount: number;
    message: string;
}
export interface TaskAssignmentStrategy {
    readonly mode: AssignmentMode;
    assign(ctx: AssignmentContext): Promise<AssignmentResult>;
}
