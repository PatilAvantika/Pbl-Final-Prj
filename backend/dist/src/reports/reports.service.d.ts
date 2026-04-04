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
export declare class ReportsService {
    private prisma;
    private tasksService;
    constructor(prisma: PrismaService, tasksService: TasksService);
    create(userId: string, data: Prisma.FieldReportUncheckedCreateInput): Promise<FieldReport>;
    findAll(query?: ReportListQuery): Promise<FieldReport[]>;
    findOne(id: string): Promise<FieldReport>;
    findByTask(taskId: string): Promise<FieldReport[]>;
    findByUser(userId: string): Promise<FieldReport[]>;
    updateStatus(reportId: string, status: ReportStatus, approverId: string): Promise<FieldReport>;
}
