import { PrismaService } from '../../../prisma/prisma.service';
import type { AssignmentContext, AssignmentResult, TaskAssignmentStrategy } from './assignment-strategy.interface';
export declare class OpenTaskAssignmentStrategy implements TaskAssignmentStrategy {
    private readonly prisma;
    readonly mode: "open";
    constructor(prisma: PrismaService);
    assign(ctx: AssignmentContext): Promise<AssignmentResult>;
}
