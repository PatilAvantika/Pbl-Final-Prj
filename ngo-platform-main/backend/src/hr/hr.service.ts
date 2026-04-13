import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Leave, LeaveStatus, LeaveType, Payslip, Prisma, Role } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';

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

@Injectable()
export class HrService {
    private readonly logger = new Logger(HrService.name);

    constructor(private prisma: PrismaService) { }

    // --- LEAVE MANAGEMENT ---
    async requestLeave(userId: string, data: Prisma.LeaveCreateInput): Promise<Leave> {
        return this.prisma.leave.create({
            data: {
                ...data,
                user: { connect: { id: userId } }
            }
        });
    }

    async updateLeaveStatus(
        leaveId: string,
        status: LeaveStatus,
        scope?: LeaveListScope,
    ): Promise<Leave> {
        const leave = await this.prisma.leave.findUnique({
            where: { id: leaveId },
            include: { user: { select: { organizationId: true } } },
        });
        if (!leave) throw new NotFoundException('Leave request not found');
        if (
            scope &&
            scope.role !== Role.SUPER_ADMIN &&
            scope.organizationId &&
            leave.user.organizationId !== scope.organizationId
        ) {
            throw new ForbiddenException('Leave request is not in your organization');
        }

        return this.prisma.leave.update({
            where: { id: leaveId },
            data: { status },
        });
    }

    async cancelLeave(leaveId: string, userId: string): Promise<void> {
        const leave = await this.prisma.leave.findUnique({ where: { id: leaveId } });
        if (!leave) throw new NotFoundException('Leave request not found');
        if (leave.userId !== userId) throw new ForbiddenException('Not your leave request');
        if (leave.status !== 'PENDING') {
            throw new BadRequestException('Only PENDING leave requests can be cancelled');
        }
        await this.prisma.leave.delete({ where: { id: leaveId } });
    }

    async getMyLeaves(userId: string): Promise<Leave[]> {
        return this.prisma.leave.findMany({
            where: { userId },
            orderBy: { startDate: 'desc' }
        });
    }

    async getAllLeaves(query: LeaveListQuery = {}, scope?: LeaveListScope): Promise<Leave[]> {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;

        const where: Prisma.LeaveWhereInput = {};
        if (query.status) where.status = query.status;
        if (query.userId) where.userId = query.userId;

        if (scope && scope.role !== Role.SUPER_ADMIN && scope.organizationId) {
            where.user = { organizationId: scope.organizationId };
        }

        return this.prisma.leave.findMany({
            where,
            include: { user: { select: { firstName: true, lastName: true, email: true, role: true } } },
            orderBy: { startDate: 'desc' },
            skip,
            take: limit,
        });
    }

    // --- PAYROLL ENGINE ---
    async generatePayslipForUser(userId: string, month: number, year: number): Promise<Payslip> {
        // Basic logic
        // 1. fetch user base salary - assume a basic calculation based on role
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        const baseMonthlySalary = user.role === 'VOLUNTEER' ? 0 : 30000; // Random mock logic
        const baseDailyRate = baseMonthlySalary / 20; // Assume 20 working days

        // 2. Count "ATTENDANCE" days (CLOCK_IN)
        // First day of month/year to last day of month/year
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);

        const attendances = await this.prisma.attendance.findMany({
            where: {
                userId,
                type: 'CLOCK_IN',
                timestamp: { gte: startDate, lte: endDate }
            }
        });

        // Count unique days correctly
        const attendanceDaysStr = new Set(attendances.map(a => `${a.timestamp.getFullYear()}-${a.timestamp.getMonth()}-${a.timestamp.getDate()}`));
        const attendanceDays = attendanceDaysStr.size;

        const absences = Math.max(0, 20 - attendanceDays); // assuming 20 working days in a month

        let baseSalary = baseMonthlySalary;
        let deductions = 0;

        if (user.role !== 'VOLUNTEER') {
            deductions = absences * baseDailyRate; // Deduct for absent days
        }

        const netPay = Math.max(0, baseSalary - deductions);

        return this.prisma.payslip.upsert({
            where: {
                userId_month_year: { userId, month, year }
            },
            update: {
                baseSalary, attendanceDays, absences, deductions, netPay
            },
            create: {
                userId, month, year, baseSalary, attendanceDays, absences, overtimeHours: 0, bonuses: 0, deductions, netPay
            }
        });
    }

    @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
    async handleMonthlyPayroll() {
        this.logger.debug('Running automated payroll generation...');
        const now = new Date();

        // Generate for previous month
        let month = now.getMonth(); // 0 is January, so if it's March (2), we generate for Feb (2 in our 1-indexed scheme)
        let year = now.getFullYear();

        if (month === 0) {
            month = 12;
            year -= 1;
        }

        const users = await this.prisma.user.findMany({ where: { isActive: true } });
        let count = 0;
        for (const user of users) {
            try {
                await this.generatePayslipForUser(user.id, month, year);
                count++;
            } catch (err) {
                this.logger.error(`Failed to generate payslip for ${user.id}`, err);
            }
        }
        this.logger.debug(`Generated ${count} payslips for ${month}/${year}`);
    }

    async getMyPayslips(userId: string): Promise<Payslip[]> {
        return this.prisma.payslip.findMany({
            where: { userId },
            orderBy: [{ year: 'desc' }, { month: 'desc' }]
        });
    }

    async getAllPayslips(query: PayslipListQuery = {}): Promise<Payslip[]> {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;
        return this.prisma.payslip.findMany({
            where: {
                userId: query.userId,
                year: query.year,
                month: query.month,
            },
            include: { user: { select: { firstName: true, lastName: true, role: true } } },
            orderBy: [{ year: 'desc' }, { month: 'desc' }],
            skip,
            take: limit,
        })
    }
}
