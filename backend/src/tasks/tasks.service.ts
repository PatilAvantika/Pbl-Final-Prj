import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Task, TaskAssignment } from '@prisma/client';

@Injectable()
export class TasksService {
    constructor(private prisma: PrismaService) { }

    async create(data: Prisma.TaskCreateInput): Promise<Task> {
        return this.prisma.task.create({ data });
    }

    async findAll(): Promise<Task[]> {
        return this.prisma.task.findMany({
            include: {
                _count: { select: { assignments: true, reports: true } }
            },
            orderBy: { startTime: 'desc' }
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

    async findAssignedToUser(userId: string): Promise<Task[]> {
        const assignments = await this.prisma.taskAssignment.findMany({
            where: { userId },
            include: { task: true }
        });
        return assignments.map(a => a.task);
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
