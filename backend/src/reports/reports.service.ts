import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, FieldReport } from '@prisma/client';
import { TasksService } from '../tasks/tasks.service';

@Injectable()
export class ReportsService {
    constructor(
        private prisma: PrismaService,
        private tasksService: TasksService
    ) { }

    async create(userId: string, data: Prisma.FieldReportUncheckedCreateInput): Promise<FieldReport> {
        // Ensure task exists
        await this.tasksService.findOne(data.taskId);

        return this.prisma.fieldReport.create({
            data: {
                ...data,
                userId
            }
        });
    }

    async findAll(): Promise<FieldReport[]> {
        return this.prisma.fieldReport.findMany({
            include: {
                task: true,
            },
            orderBy: { timestamp: 'desc' },
        });
    }

    async findOne(id: string): Promise<FieldReport> {
        const report = await this.prisma.fieldReport.findUnique({
            where: { id },
            include: { task: true }
        });
        if (!report) throw new NotFoundException('Report not found');
        return report;
    }

    async findByTask(taskId: string): Promise<FieldReport[]> {
        return this.prisma.fieldReport.findMany({
            where: { taskId },
            orderBy: { timestamp: 'desc' }
        });
    }

    async findByUser(userId: string): Promise<FieldReport[]> {
        return this.prisma.fieldReport.findMany({
            where: { userId },
            include: { task: true },
            orderBy: { timestamp: 'desc' }
        });
    }
}
