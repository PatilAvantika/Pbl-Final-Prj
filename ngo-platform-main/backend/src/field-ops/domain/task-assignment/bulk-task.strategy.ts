import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type { AssignmentContext, AssignmentResult, TaskAssignmentStrategy } from './assignment-strategy.interface';

const ASSIGNABLE_ROLES: Role[] = [Role.VOLUNTEER, Role.STAFF];

/**
 * Bulk assign: replace assignments with given user IDs (must be org members with volunteer/staff roles).
 */
@Injectable()
export class BulkTaskAssignmentStrategy implements TaskAssignmentStrategy {
    readonly mode = 'bulk' as const;

    constructor(private readonly prisma: PrismaService) {}

    async assign(ctx: AssignmentContext): Promise<AssignmentResult> {
        const userIds = ctx.userIds ?? [];
        if (userIds.length === 0) {
            throw new BadRequestException('bulk mode requires userIds');
        }

        const task = await this.prisma.task.findFirst({
            where: { id: ctx.taskId, organizationId: ctx.organizationId },
        });
        if (!task) throw new NotFoundException('Task not found');

        const users = await this.prisma.user.findMany({
            where: {
                id: { in: userIds },
                organizationId: ctx.organizationId,
                role: { in: ASSIGNABLE_ROLES },
            },
            select: { id: true },
        });
        const ok = new Set(users.map((u) => u.id));
        for (const uid of userIds) {
            if (!ok.has(uid)) {
                throw new BadRequestException(`User ${uid} is not an assignable member of this organization`);
            }
        }

        await this.prisma.$transaction(async (tx) => {
            await tx.taskAssignment.deleteMany({ where: { taskId: ctx.taskId } });
            for (const userId of userIds) {
                await tx.taskAssignment.create({
                    data: { taskId: ctx.taskId, userId },
                });
            }
        });

        return {
            assignedCount: userIds.length,
            message: `Assigned task to ${userIds.length} volunteer(s)`,
        };
    }
}
