import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type { AssignmentContext, AssignmentResult, TaskAssignmentStrategy } from './assignment-strategy.interface';

/**
 * Open task: clear fixed assignments; volunteers pick up from the shared list.
 */
@Injectable()
export class OpenTaskAssignmentStrategy implements TaskAssignmentStrategy {
    readonly mode = 'open' as const;

    constructor(private readonly prisma: PrismaService) {}

    async assign(ctx: AssignmentContext): Promise<AssignmentResult> {
        const task = await this.prisma.task.findFirst({
            where: { id: ctx.taskId, organizationId: ctx.organizationId },
        });
        if (!task) throw new NotFoundException('Task not found');

        await this.prisma.taskAssignment.deleteMany({ where: { taskId: ctx.taskId } });

        return {
            assignedCount: 0,
            message: 'Task published as open; team members may pick it up from the task list',
        };
    }
}
