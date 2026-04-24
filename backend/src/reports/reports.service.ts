import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, FieldReport, ReportStatus } from '@prisma/client';
import { TasksService } from '../tasks/tasks.service';
import { DonorCacheService } from '../donor/donor-cache.service';
import { ReportQueueService } from '../queue/report-queue.service';
import { ReportSummaryService } from '../ai/report-summary.service';

export interface ReportListQuery {
    page?: number;
    limit?: number;
    taskId?: string;
    userId?: string;
    status?: ReportStatus;
}

@Injectable()
export class ReportsService {
    private readonly logger = new Logger(ReportsService.name);

    constructor(
        private prisma: PrismaService,
        private tasksService: TasksService,
        private readonly donorCache: DonorCacheService,
        private readonly reportQueue: ReportQueueService,
        private readonly reportSummary: ReportSummaryService,
    ) {}

    async create(
        userId: string,
        organizationId: string,
        data: Omit<Prisma.FieldReportUncheckedCreateInput, 'userId' | 'organizationId'>,
    ): Promise<FieldReport> {
        await this.tasksService.assertUserAssignedToTask(userId, data.taskId);
        const task = await this.tasksService.findOneInOrganization(data.taskId, organizationId);

        const report = await this.prisma.fieldReport.create({
            data: {
                ...data,
                userId,
                organizationId: task.organizationId,
            },
        });
        this.logger.log(`field report created reportId=${report.id} userId=${userId} taskId=${data.taskId}`);
        await this.reportQueue.enqueueReportProcessing(report.id);
        // Non-blocking AI summary — failures never affect submit response.
        void this.reportSummary.trySummarizeReport(report.id).catch(() => undefined);
        return report;
    }

    async findAll(query: ReportListQuery = {}, organizationId: string): Promise<FieldReport[]> {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;
        return this.prisma.fieldReport.findMany({
            where: {
                organizationId,
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

    async findOne(id: string, organizationId: string): Promise<FieldReport> {
        const report = await this.prisma.fieldReport.findFirst({
            where: { id, organizationId },
            include: { task: true, user: true, approvedBy: true },
        });
        if (!report) throw new NotFoundException('Report not found');
        return report;
    }

    async findByTask(taskId: string, organizationId: string): Promise<FieldReport[]> {
        await this.tasksService.findOneInOrganization(taskId, organizationId);
        return this.prisma.fieldReport.findMany({
            where: { taskId, organizationId },
            include: { user: { select: { firstName: true, lastName: true, role: true } } },
            orderBy: { timestamp: 'desc' },
        });
    }

    async findByUser(userId: string, organizationId: string): Promise<FieldReport[]> {
        return this.prisma.fieldReport.findMany({
            where: { userId, organizationId },
            include: { task: true },
            orderBy: { timestamp: 'desc' },
        });
    }

    /**
     * Reports for tasks this user leads (`task.teamLeaderId`), or tasks with no designated leader.
     * (Volunteers are on `assignments`; team leaders usually are not — the old `assignments.some(TL)` branch hid all typical field reports.)
     */
    async findForTeamLeader(teamLeaderId: string, organizationId: string): Promise<FieldReport[]> {
        const tasks = await this.prisma.task.findMany({
            where: {
                organizationId,
                OR: [{ teamLeaderId: teamLeaderId }, { teamLeaderId: null }],
            },
            select: { id: true },
        });
        const taskIds = tasks.map((t) => t.id);
        if (taskIds.length === 0) {
            return [];
        }
        return this.prisma.fieldReport.findMany({
            where: { organizationId, taskId: { in: taskIds } },
            include: {
                task: true,
                user: { select: { firstName: true, lastName: true, email: true, role: true } },
            },
            orderBy: { timestamp: 'desc' },
        });
    }

    async reviewByTeamLeader(
        reportId: string,
        status: 'APPROVED' | 'REJECTED',
        teamLeaderId: string,
        organizationId: string,
    ): Promise<FieldReport> {
        const report = await this.findOne(reportId, organizationId);
        if (report.status !== ReportStatus.SUBMITTED) {
            throw new BadRequestException('Only submitted reports can be reviewed');
        }
        await this.tasksService.assertTeamLeaderOfTask(report.taskId, organizationId, teamLeaderId);
        const nextStatus = status === 'APPROVED' ? ReportStatus.APPROVED : ReportStatus.REJECTED;
        return this.updateStatus(reportId, nextStatus, teamLeaderId, organizationId);
    }

    async updateStatus(
        reportId: string,
        status: ReportStatus,
        approverId: string,
        approverOrganizationId: string,
    ): Promise<FieldReport> {
        await this.findOne(reportId, approverOrganizationId);
        const report = await this.prisma.fieldReport.update({
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
        if (status === ReportStatus.APPROVED) {
            await this.donorCache.invalidateDashboardForReport(reportId);
        }
        return report;
    }
}
