import { PrismaService } from '../prisma/prisma.service';
import { Leave, LeaveStatus, Payslip, Prisma, Role } from '@prisma/client';
interface LeaveListQuery {
    page?: number;
    limit?: number;
    status?: LeaveStatus;
    userId?: string;
}
export interface LeaveListScope {
    organizationId?: string | null;
    role: Role;
}
interface PayslipListQuery {
    page?: number;
    limit?: number;
    userId?: string;
    year?: number;
    month?: number;
}
export declare class HrService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    requestLeave(userId: string, data: Prisma.LeaveCreateInput): Promise<Leave>;
    updateLeaveStatus(leaveId: string, status: LeaveStatus, scope?: LeaveListScope): Promise<Leave>;
    cancelLeave(leaveId: string, userId: string): Promise<void>;
    getMyLeaves(userId: string): Promise<Leave[]>;
    getAllLeaves(query?: LeaveListQuery, scope?: LeaveListScope): Promise<Leave[]>;
    generatePayslipForUser(userId: string, month: number, year: number): Promise<Payslip>;
    handleMonthlyPayroll(): Promise<void>;
    getMyPayslips(userId: string): Promise<Payslip[]>;
    getAllPayslips(query?: PayslipListQuery): Promise<Payslip[]>;
}
export {};
