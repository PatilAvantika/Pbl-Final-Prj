import { PrismaService } from '../prisma/prisma.service';
import { Leave, LeaveStatus, Payslip, Prisma } from '@prisma/client';
export declare class HrService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    requestLeave(userId: string, data: Prisma.LeaveCreateInput): Promise<Leave>;
    updateLeaveStatus(leaveId: string, status: LeaveStatus): Promise<Leave>;
    getMyLeaves(userId: string): Promise<Leave[]>;
    getAllLeaves(): Promise<Leave[]>;
    generatePayslipForUser(userId: string, month: number, year: number): Promise<Payslip>;
    handleMonthlyPayroll(): Promise<void>;
    getMyPayslips(userId: string): Promise<Payslip[]>;
    getAllPayslips(): Promise<Payslip[]>;
}
