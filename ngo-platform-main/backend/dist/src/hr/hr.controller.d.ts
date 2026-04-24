import { HrService } from './hr.service';
import { LeaveStatus, LeaveType } from '@prisma/client';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { AuditService } from '../audit/audit.service';
export declare class RequestLeaveDto {
    type: LeaveType;
    startDate: string | Date;
    endDate: string | Date;
    reason: string;
}
export declare class UpdateLeaveStatusDto {
    status: LeaveStatus;
}
export declare class LeaveListQueryDto extends PaginationQueryDto {
    status?: LeaveStatus;
    userId?: string;
}
export declare class PayslipListQueryDto extends PaginationQueryDto {
    userId?: string;
    year?: number;
    month?: number;
}
export declare class HrController {
    private readonly hrService;
    private readonly auditService;
    constructor(hrService: HrService, auditService: AuditService);
    requestLeave(req: any, data: RequestLeaveDto): Promise<{
        status: import("@prisma/client").$Enums.LeaveStatus;
        id: string;
        userId: string;
        type: import("@prisma/client").$Enums.LeaveType;
        reason: string;
        startDate: Date;
        endDate: Date;
    }>;
    getMyLeaves(req: any): Promise<{
        status: import("@prisma/client").$Enums.LeaveStatus;
        id: string;
        userId: string;
        type: import("@prisma/client").$Enums.LeaveType;
        reason: string;
        startDate: Date;
        endDate: Date;
    }[]>;
    getAllLeaves(query: LeaveListQueryDto, req: any): Promise<{
        status: import("@prisma/client").$Enums.LeaveStatus;
        id: string;
        userId: string;
        type: import("@prisma/client").$Enums.LeaveType;
        reason: string;
        startDate: Date;
        endDate: Date;
    }[]>;
    cancelLeave(leaveId: string, req: any): Promise<void>;
    updateLeaveStatus(leaveId: string, data: UpdateLeaveStatusDto, req: any): Promise<{
        status: import("@prisma/client").$Enums.LeaveStatus;
        id: string;
        userId: string;
        type: import("@prisma/client").$Enums.LeaveType;
        reason: string;
        startDate: Date;
        endDate: Date;
    }>;
    getMyPayslips(req: any): Promise<{
        id: string;
        userId: string;
        month: number;
        year: number;
        baseSalary: number;
        attendanceDays: number;
        absences: number;
        overtimeHours: number;
        bonuses: number;
        deductions: number;
        netPay: number;
        pdfUrl: string | null;
    }[]>;
    getAllPayslips(query: PayslipListQueryDto): Promise<{
        id: string;
        userId: string;
        month: number;
        year: number;
        baseSalary: number;
        attendanceDays: number;
        absences: number;
        overtimeHours: number;
        bonuses: number;
        deductions: number;
        netPay: number;
        pdfUrl: string | null;
    }[]>;
    generatePayslip(userId: string, year: number, month: number, req: any): Promise<{
        id: string;
        userId: string;
        month: number;
        year: number;
        baseSalary: number;
        attendanceDays: number;
        absences: number;
        overtimeHours: number;
        bonuses: number;
        deductions: number;
        netPay: number;
        pdfUrl: string | null;
    }>;
}
