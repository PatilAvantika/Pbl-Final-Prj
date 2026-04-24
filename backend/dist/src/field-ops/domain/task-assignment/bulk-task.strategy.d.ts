import { PrismaService } from '../../../prisma/prisma.service';
import type { AssignmentContext, AssignmentResult, TaskAssignmentStrategy } from './assignment-strategy.interface';
export declare class BulkTaskAssignmentStrategy implements TaskAssignmentStrategy {
    private readonly prisma;
    readonly mode: "bulk";
    constructor(prisma: PrismaService);
    assign(ctx: AssignmentContext): Promise<AssignmentResult>;
}
