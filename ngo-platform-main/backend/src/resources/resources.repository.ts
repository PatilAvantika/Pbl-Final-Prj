import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ResourcesRepository {
    constructor(private readonly prisma: PrismaService) {}

    findAllByOrganization(organizationId: string) {
        return this.prisma.resource.findMany({
            where: { organizationId },
            orderBy: { name: 'asc' },
        });
    }

    async allocate(
        organizationId: string,
        resourceId: string,
        taskId: string,
        quantity: number,
    ) {
        return this.prisma.$transaction(async (tx) => {
            const resource = await tx.resource.findFirst({
                where: { id: resourceId, organizationId },
            });
            if (!resource) throw new Error('Resource not found');
            if (resource.quantity < quantity) throw new Error('Insufficient quantity');

            const task = await tx.task.findFirst({
                where: { id: taskId, organizationId },
            });
            if (!task) throw new Error('Task not found');

            await tx.resource.update({
                where: { id: resourceId },
                data: { quantity: resource.quantity - quantity },
            });
            return tx.resourceAllocation.create({
                data: { resourceId, taskId, quantity },
            });
        });
    }
}
