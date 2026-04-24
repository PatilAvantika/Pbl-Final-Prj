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
export declare class ReportsService {
    private prisma;
    private tasksService;
    private readonly donorCache;
    private readonly reportQueue;
    private readonly reportSummary;
    private readonly logger;
    constructor(prisma: PrismaService, tasksService: TasksService, donorCache: DonorCacheService, reportQueue: ReportQueueService, reportSummary: ReportSummaryService);
    create(userId: string, organizationId: string, data: Omit<Prisma.FieldReportUncheckedCreateInput, 'userId' | 'organizationId'>): Promise<FieldReport>;
    findAll(query: ReportListQuery | undefined, organizationId: string): Promise<FieldReport[]>;
    findOne(id: string, organizationId: string): Promise<FieldReport>;
    findByTask(taskId: string, organizationId: string): Promise<FieldReport[]>;
    findByUser(userId: string, organizationId: string): Promise<FieldReport[]>;
    findForTeamLeader(teamLeaderId: string, organizationId: string): Promise<FieldReport[]>;
    reviewByTeamLeader(reportId: string, status: 'APPROVED' | 'REJECTED', teamLeaderId: string, organizationId: string): Promise<FieldReport>;
    updateStatus(reportId: string, status: ReportStatus, approverId: string, approverOrganizationId: string): Promise<FieldReport>;
}
