import { ReportsService } from './reports.service';
import { ReportStatus } from '@prisma/client';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { AuditService } from '../audit/audit.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ReviewReportDto } from './dto/review-report.dto';
export declare class UpdateReportStatusDto {
    status: ReportStatus;
    comment?: string;
}
export declare class ApproveReportDto {
    reportId: string;
    decision: 'APPROVE' | 'REJECT';
    remarks?: string;
}
export declare class ReportsQueryDto extends PaginationQueryDto {
    taskId?: string;
    userId?: string;
    status?: ReportStatus;
}
export declare class ReportsController {
    private readonly reportsService;
    private readonly auditService;
    constructor(reportsService: ReportsService, auditService: AuditService);
    create(req: any, dto: CreateReportDto): Promise<{
        organizationId: string;
        status: import("@prisma/client").$Enums.ReportStatus;
        id: string;
        userId: string;
        taskId: string;
        timestamp: Date;
        beforePhotoUrl: string | null;
        afterPhotoUrl: string | null;
        quantityItems: number | null;
        notes: string | null;
        aiSummary: string | null;
        approvedById: string | null;
        approvedAt: Date | null;
    }>;
    findAll(query: ReportsQueryDto, req: any): Promise<{
        organizationId: string;
        status: import("@prisma/client").$Enums.ReportStatus;
        id: string;
        userId: string;
        taskId: string;
        timestamp: Date;
        beforePhotoUrl: string | null;
        afterPhotoUrl: string | null;
        quantityItems: number | null;
        notes: string | null;
        aiSummary: string | null;
        approvedById: string | null;
        approvedAt: Date | null;
    }[]>;
    findMyReports(req: any): Promise<{
        organizationId: string;
        status: import("@prisma/client").$Enums.ReportStatus;
        id: string;
        userId: string;
        taskId: string;
        timestamp: Date;
        beforePhotoUrl: string | null;
        afterPhotoUrl: string | null;
        quantityItems: number | null;
        notes: string | null;
        aiSummary: string | null;
        approvedById: string | null;
        approvedAt: Date | null;
    }[]>;
    findForTeamLeader(req: any): Promise<{
        organizationId: string;
        status: import("@prisma/client").$Enums.ReportStatus;
        id: string;
        userId: string;
        taskId: string;
        timestamp: Date;
        beforePhotoUrl: string | null;
        afterPhotoUrl: string | null;
        quantityItems: number | null;
        notes: string | null;
        aiSummary: string | null;
        approvedById: string | null;
        approvedAt: Date | null;
    }[]>;
    findByTask(taskId: string, req: any): Promise<{
        organizationId: string;
        status: import("@prisma/client").$Enums.ReportStatus;
        id: string;
        userId: string;
        taskId: string;
        timestamp: Date;
        beforePhotoUrl: string | null;
        afterPhotoUrl: string | null;
        quantityItems: number | null;
        notes: string | null;
        aiSummary: string | null;
        approvedById: string | null;
        approvedAt: Date | null;
    }[]>;
    reviewAsTeamLeader(id: string, dto: ReviewReportDto, req: any): Promise<{
        organizationId: string;
        status: import("@prisma/client").$Enums.ReportStatus;
        id: string;
        userId: string;
        taskId: string;
        timestamp: Date;
        beforePhotoUrl: string | null;
        afterPhotoUrl: string | null;
        quantityItems: number | null;
        notes: string | null;
        aiSummary: string | null;
        approvedById: string | null;
        approvedAt: Date | null;
    }>;
    findOne(id: string, req: any): Promise<{
        organizationId: string;
        status: import("@prisma/client").$Enums.ReportStatus;
        id: string;
        userId: string;
        taskId: string;
        timestamp: Date;
        beforePhotoUrl: string | null;
        afterPhotoUrl: string | null;
        quantityItems: number | null;
        notes: string | null;
        aiSummary: string | null;
        approvedById: string | null;
        approvedAt: Date | null;
    }>;
    updateStatus(id: string, data: UpdateReportStatusDto, req: any): Promise<{
        organizationId: string;
        status: import("@prisma/client").$Enums.ReportStatus;
        id: string;
        userId: string;
        taskId: string;
        timestamp: Date;
        beforePhotoUrl: string | null;
        afterPhotoUrl: string | null;
        quantityItems: number | null;
        notes: string | null;
        aiSummary: string | null;
        approvedById: string | null;
        approvedAt: Date | null;
    }>;
    approve(body: ApproveReportDto, req: any): Promise<{
        organizationId: string;
        status: import("@prisma/client").$Enums.ReportStatus;
        id: string;
        userId: string;
        taskId: string;
        timestamp: Date;
        beforePhotoUrl: string | null;
        afterPhotoUrl: string | null;
        quantityItems: number | null;
        notes: string | null;
        aiSummary: string | null;
        approvedById: string | null;
        approvedAt: Date | null;
    }>;
}
