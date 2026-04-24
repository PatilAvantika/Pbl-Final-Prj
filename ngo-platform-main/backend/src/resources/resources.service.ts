import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ResourcesRepository } from './resources.repository';
import { AllocateResourceDto, CreateResourceDto } from './dto/allocate-resource.dto';
import { PrismaService } from '../prisma/prisma.service';

const PRIVILEGED: Role[] = [
    Role.SUPER_ADMIN,
    Role.NGO_ADMIN,
    Role.FIELD_COORDINATOR,
    Role.TEAM_LEADER,
];

@Injectable()
export class ResourcesService {
    constructor(
        private readonly repo: ResourcesRepository,
        private readonly prisma: PrismaService,
    ) {}

    list(organizationId: string) {
        return this.repo.findAllByOrganization(organizationId);
    }

    async create(organizationId: string, dto: CreateResourceDto) {
        return this.prisma.resource.create({
            data: {
                name: dto.name,
                quantity: dto.quantity ?? 0,
                organization: { connect: { id: organizationId } },
            },
        });
    }

    /** Allocations for tasks the requester may manage (team leader: own tasks; admins: whole org). */
    async listAllocations(userId: string, role: Role, organizationId: string) {
        let taskIds: string[];
        if (role === Role.TEAM_LEADER) {
            const tasks = await this.prisma.task.findMany({
                where: {
                    organizationId,
                    OR: [
                        { teamLeaderId: userId },
                        { teamLeaderId: null, assignments: { some: { userId } } },
                    ],
                },
                select: { id: true },
            });
            taskIds = tasks.map((t) => t.id);
        } else {
            const tasks = await this.prisma.task.findMany({
                where: { organizationId },
                select: { id: true },
                take: 2000,
            });
            taskIds = tasks.map((t) => t.id);
        }
        if (taskIds.length === 0) {
            return [];
        }
        return this.prisma.resourceAllocation.findMany({
            where: { taskId: { in: taskIds } },
            include: {
                resource: true,
                task: { select: { id: true, title: true } },
            },
            orderBy: { id: 'desc' },
            take: 500,
        });
    }

    async allocate(actorId: string, role: Role, organizationId: string, dto: AllocateResourceDto) {
        if (!PRIVILEGED.includes(role)) {
            throw new BadRequestException('Not allowed to allocate resources');
        }
        if (role === Role.TEAM_LEADER) {
            const task = await this.prisma.task.findFirst({
                where: {
                    id: dto.taskId,
                    organizationId,
                    OR: [
                        { teamLeaderId: actorId },
                        { teamLeaderId: null, assignments: { some: { userId: actorId } } },
                    ],
                },
                select: { id: true },
            });
            if (!task) {
                throw new BadRequestException('Task not found or you are not the team leader for this task');
            }
        }
        try {
            return await this.repo.allocate(organizationId, dto.resourceId, dto.taskId, dto.quantity);
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Allocate failed';
            if (msg === 'Resource not found') throw new NotFoundException(msg);
            if (msg === 'Task not found') throw new NotFoundException(msg);
            throw new BadRequestException(msg);
        }
    }
}
