import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, FieldReport, ReportStatus } from '@prisma/client';
import { TasksService } from '../tasks/tasks.service';

export interface ReportListQuery {
    page?: number;
    limit?: number;
    taskId?: string;
    userId?: string;
    status?: ReportStatus;
}

@Injectable()
export class ReportsService {
    constructor(
        private prisma: PrismaService,
        private tasksService: TasksService
    ) { }

    async create(userId: string, data: Prisma.FieldReportUncheckedCreateInput): Promise<FieldReport> {
        await this.tasksService.assertUserAssignedToTask(userId, data.taskId);
        await this.tasksService.findOne(data.taskId);

        return this.prisma.fieldReport.create({
            data: {
                ...data,
                userId
            }
        });
    }

    async findAll(query: ReportListQuery = {}): Promise<FieldReport[]> {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;
        return this.prisma.fieldReport.findMany({
            where: {
                taskId: query.taskId,
                userId: query.userId,
                status: query.status,
            },
            include: {
                task: true,
                user: { select: { firstName: true, lastName: true, role: true } },
                approvedBy: { select: { firstName: true, lastName: true, role: true } },
            },
            orderBy: { timestamp: 'desc' },
            skip,
            take: limit,
        });
    }

    async findOne(id: string): Promise<FieldReport> {
        const report = await this.prisma.fieldReport.findUnique({
            where: { id },
            include: { task: true, user: true, approvedBy: true }
        });
        if (!report) throw new NotFoundException('Report not found');
        return report;
    }

    async findByTask(taskId: string): Promise<FieldReport[]> {
        return this.prisma.fieldReport.findMany({
            where: { taskId },
            include: { user: { select: { firstName: true, lastName: true, role: true } } },
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

    async updateStatus(reportId: string, status: ReportStatus, approverId: string): Promise<FieldReport> {
        await this.findOne(reportId);
        return this.prisma.fieldReport.update({
            where: { id: reportId },
            data: {
                status,
                approvedById: approverId,
                approvedAt: new Date(),
            },
            include: {
                task: true,
                user: { select: { firstName: true, lastName: true, role: true } },
                approvedBy: { select: { firstName: true, lastName: true, role: true } },
            },
        });
    }
}
