import { ReportsService } from './reports.service';
import { ReportStatus } from '@prisma/client';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { AuditService } from '../audit/audit.service';
export declare class CreateReportDto {
    taskId: string;
    beforePhotoUrl?: string;
    afterPhotoUrl?: string;
    quantityItems?: number;
    notes?: string;
}
export declare class UpdateReportStatusDto {
    status: ReportStatus;
    comment?: string;
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
    create(req: any, data: CreateReportDto): Promise<{
        id: string;
        userId: string;
        taskId: string;
        timestamp: Date;
        status: import("@prisma/client").$Enums.ReportStatus;
        beforePhotoUrl: string | null;
        afterPhotoUrl: string | null;
        quantityItems: number | null;
        notes: string | null;
        approvedAt: Date | null;
        approvedById: string | null;
    }>;
    findAll(query: ReportsQueryDto): Promise<{
        id: string;
        userId: string;
        taskId: string;
        timestamp: Date;
        status: import("@prisma/client").$Enums.ReportStatus;
        beforePhotoUrl: string | null;
        afterPhotoUrl: string | null;
        quantityItems: number | null;
        notes: string | null;
        approvedAt: Date | null;
        approvedById: string | null;
    }[]>;
    findMyReports(req: any): Promise<{
        id: string;
        userId: string;
        taskId: string;
        timestamp: Date;
        status: import("@prisma/client").$Enums.ReportStatus;
        beforePhotoUrl: string | null;
        afterPhotoUrl: string | null;
        quantityItems: number | null;
        notes: string | null;
        approvedAt: Date | null;
        approvedById: string | null;
    }[]>;
    findByTask(taskId: string): Promise<{
        id: string;
        userId: string;
        taskId: string;
        timestamp: Date;
        status: import("@prisma/client").$Enums.ReportStatus;
        beforePhotoUrl: string | null;
        afterPhotoUrl: string | null;
        quantityItems: number | null;
        notes: string | null;
        approvedAt: Date | null;
        approvedById: string | null;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        userId: string;
        taskId: string;
        timestamp: Date;
        status: import("@prisma/client").$Enums.ReportStatus;
        beforePhotoUrl: string | null;
        afterPhotoUrl: string | null;
        quantityItems: number | null;
        notes: string | null;
        approvedAt: Date | null;
        approvedById: string | null;
    }>;
    updateStatus(id: string, data: UpdateReportStatusDto, req: any): Promise<{
        id: string;
        userId: string;
        taskId: string;
        timestamp: Date;
        status: import("@prisma/client").$Enums.ReportStatus;
        beforePhotoUrl: string | null;
        afterPhotoUrl: string | null;
        quantityItems: number | null;
        notes: string | null;
        approvedAt: Date | null;
        approvedById: string | null;
    }>;
}
