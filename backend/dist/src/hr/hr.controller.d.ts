import { HrService } from './hr.service';
import { LeaveStatus, LeaveType } from '@prisma/client';
export declare class RequestLeaveDto {
    type: LeaveType;
    startDate: string | Date;
    endDate: string | Date;
    reason: string;
}
export declare class UpdateLeaveStatusDto {
    status: LeaveStatus;
}
export declare class HrController {
    private readonly hrService;
    constructor(hrService: HrService);
    requestLeave(req: any, data: RequestLeaveDto): Promise<{
        id: string;
        type: import("@prisma/client").$Enums.LeaveType;
        userId: string;
        startDate: Date;
        endDate: Date;
        status: import("@prisma/client").$Enums.LeaveStatus;
        reason: string;
    }>;
    getMyLeaves(req: any): Promise<{
        id: string;
        type: import("@prisma/client").$Enums.LeaveType;
        userId: string;
        startDate: Date;
        endDate: Date;
        status: import("@prisma/client").$Enums.LeaveStatus;
        reason: string;
    }[]>;
    getAllLeaves(): Promise<{
        id: string;
        type: import("@prisma/client").$Enums.LeaveType;
        userId: string;
        startDate: Date;
        endDate: Date;
        status: import("@prisma/client").$Enums.LeaveStatus;
        reason: string;
    }[]>;
    updateLeaveStatus(leaveId: string, data: UpdateLeaveStatusDto): Promise<{
        id: string;
        type: import("@prisma/client").$Enums.LeaveType;
        userId: string;
        startDate: Date;
        endDate: Date;
        status: import("@prisma/client").$Enums.LeaveStatus;
        reason: string;
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
    getAllPayslips(): Promise<{
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
    generatePayslip(userId: string, year: number, month: number): Promise<{
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
