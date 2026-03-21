"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var HrService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HrService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const schedule_1 = require("@nestjs/schedule");
let HrService = HrService_1 = class HrService {
    prisma;
    logger = new common_1.Logger(HrService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async requestLeave(userId, data) {
        return this.prisma.leave.create({
            data: {
                ...data,
                user: { connect: { id: userId } }
            }
        });
    }
    async updateLeaveStatus(leaveId, status) {
        const leave = await this.prisma.leave.findUnique({ where: { id: leaveId } });
        if (!leave)
            throw new common_1.NotFoundException('Leave request not found');
        return this.prisma.leave.update({
            where: { id: leaveId },
            data: { status }
        });
    }
    async getMyLeaves(userId) {
        return this.prisma.leave.findMany({
            where: { userId },
            orderBy: { startDate: 'desc' }
        });
    }
    async getAllLeaves() {
        return this.prisma.leave.findMany({
            include: { user: { select: { firstName: true, lastName: true, email: true, role: true } } },
            orderBy: { startDate: 'desc' }
        });
    }
    async generatePayslipForUser(userId, month, year) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const baseMonthlySalary = user.role === 'VOLUNTEER' ? 0 : 30000;
        const baseDailyRate = baseMonthlySalary / 20;
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);
        const attendances = await this.prisma.attendance.findMany({
            where: {
                userId,
                type: 'CLOCK_IN',
                timestamp: { gte: startDate, lte: endDate }
            }
        });
        const attendanceDaysStr = new Set(attendances.map(a => `${a.timestamp.getFullYear()}-${a.timestamp.getMonth()}-${a.timestamp.getDate()}`));
        const attendanceDays = attendanceDaysStr.size;
        const absences = Math.max(0, 20 - attendanceDays);
        let baseSalary = baseMonthlySalary;
        let deductions = 0;
        if (user.role !== 'VOLUNTEER') {
            deductions = absences * baseDailyRate;
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
    async handleMonthlyPayroll() {
        this.logger.debug('Running automated payroll generation...');
        const now = new Date();
        let month = now.getMonth();
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
            }
            catch (err) {
                this.logger.error(`Failed to generate payslip for ${user.id}`, err);
            }
        }
        this.logger.debug(`Generated ${count} payslips for ${month}/${year}`);
    }
    async getMyPayslips(userId) {
        return this.prisma.payslip.findMany({
            where: { userId },
            orderBy: [{ year: 'desc' }, { month: 'desc' }]
        });
    }
    async getAllPayslips() {
        return this.prisma.payslip.findMany({
            include: { user: { select: { firstName: true, lastName: true, role: true } } },
            orderBy: [{ year: 'desc' }, { month: 'desc' }]
        });
    }
};
exports.HrService = HrService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HrService.prototype, "handleMonthlyPayroll", null);
exports.HrService = HrService = HrService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HrService);
//# sourceMappingURL=hr.service.js.map