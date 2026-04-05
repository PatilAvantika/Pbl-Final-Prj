import { ForbiddenException, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Role, Task, TaskAssignment, TaskTemplate } from '@prisma/client';

const TASK_DETAIL_PRIVILEGED_ROLES: Role[] = [
    Role.SUPER_ADMIN,
    Role.NGO_ADMIN,
    Role.FIELD_COORDINATOR,
    Role.HR_MANAGER,
    Role.FINANCE_MANAGER,
];

export interface TaskListQuery {
    page?: number;
    limit?: number;
    search?: string;
    template?: TaskTemplate;
    isActive?: boolean;
}

@Injectable()
export class TasksService {
    constructor(private prisma: PrismaService) { }

    async create(data: Prisma.TaskCreateInput): Promise<Task> {
        return this.prisma.task.create({ data });
    }

    async findAll(query: TaskListQuery = {}): Promise<Task[]> {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;
        return this.prisma.task.findMany({
            where: {
                template: query.template,
                isActive: query.isActive,
                OR: query.search
                    ? [
                        { title: { contains: query.search, mode: 'insensitive' } },
                        { zoneName: { contains: query.search, mode: 'insensitive' } },
                    ]
                    : undefined,
            },
            include: {
                _count: { select: { assignments: true, reports: true } }
            },
            orderBy: { startTime: 'desc' },
            skip,
            take: limit,
        });
    }

    async findOne(id: string): Promise<Task> {
        const task = await this.prisma.task.findUnique({
            where: { id },
            include: { assignments: { include: { user: { select: { id: true, firstName: true, lastName: true, role: true } } } } }
        });
        if (!task) throw new NotFoundException('Task not found');
        return task;
    }

    /** Task detail: privileged roles see all tasks; others only if assigned. */
    async findOneForRequester(id: string, requesterId: string, requesterRole: Role): Promise<Task> {
        if (TASK_DETAIL_PRIVILEGED_ROLES.includes(requesterRole)) {
            return this.findOne(id);
        }
        const task = await this.prisma.task.findUnique({
            where: { id },
            include: { assignments: { include: { user: { select: { id: true, firstName: true, lastName: true, role: true } } } } }
        });
        if (!task) throw new NotFoundException('Task not found');
        const isAssigned = task.assignments.some((a) => a.userId === requesterId);
        if (!isAssigned) {
            throw new ForbiddenException('Task not found or access denied');
        }
        return task;
    }

    /** Assigned tasks relevant to the current calendar day (server local time). */
    async findAssignedToUser(userId: string): Promise<Task[]> {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        const assignments = await this.prisma.taskAssignment.findMany({
            where: {
                userId,
                task: {
                    isActive: true,
                    startTime: { lte: endOfDay },
                    endTime: { gte: startOfDay },
                },
            },
            include: { task: true },
            orderBy: { task: { startTime: 'asc' } },
        });
        return assignments.map((a) => a.task);
    }

    async assertUserAssignedToTask(userId: string, taskId: string): Promise<void> {
        const assignment = await this.prisma.taskAssignment.findUnique({
            where: { userId_taskId: { userId, taskId } },
        });
        if (!assignment) {
            throw new ForbiddenException('You are not assigned to this task');
        }
    }

    async assignUserToTask(taskId: string, userId: string): Promise<TaskAssignment> {
        // Validate existence
        await this.findOne(taskId);

        // Check if already assigned
        const existing = await this.prisma.taskAssignment.findUnique({
            where: { userId_taskId: { userId, taskId } }
        });

        if (existing) {
            throw new ConflictException('User is already assigned to this task');
        }

        return this.prisma.taskAssignment.create({
            data: {
                taskId,
                userId
            }
        });
    }

    async removeUserFromTask(taskId: string, userId: string): Promise<void> {
        try {
            await this.prisma.taskAssignment.delete({
                where: { userId_taskId: { userId, taskId } }
            });
        } catch (e) {
            throw new NotFoundException('Assignment not found');
        }
    }

    async update(id: string, data: Prisma.TaskUpdateInput): Promise<Task> {
        await this.findOne(id);
        return this.prisma.task.update({ where: { id }, data });
    }

    async remove(id: string): Promise<Task> {
        await this.findOne(id);
        return this.prisma.task.delete({ where: { id } });
    }
}
