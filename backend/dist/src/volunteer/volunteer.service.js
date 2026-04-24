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
Object.defineProperty(exports, "__esModule", { value: true });
exports.VolunteerService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const decision_intelligence_service_1 = require("../analytics/decision-intelligence.service");
let VolunteerService = class VolunteerService {
    prisma;
    decisionIntelligence;
    constructor(prisma, decisionIntelligence) {
        this.prisma = prisma;
        this.decisionIntelligence = decisionIntelligence;
    }
    toLocalDateKey(d) {
        return d.toDateString();
    }
    monthBounds(now) {
        const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        return { start, end };
    }
    async getDashboardStats(userId, organizationId) {
        const now = new Date();
        const { start: monthStart, end: monthEnd } = this.monthBounds(now);
        const [monthRows, allClockIns, completedAssignments] = await Promise.all([
            this.prisma.attendance.findMany({
                where: {
                    userId,
                    timestamp: { gte: monthStart, lte: monthEnd },
                },
                orderBy: { timestamp: 'asc' },
            }),
            this.prisma.attendance.findMany({
                where: { userId, type: 'CLOCK_IN' },
                select: { timestamp: true },
                orderBy: { timestamp: 'desc' },
            }),
            this.prisma.taskAssignment.count({
                where: {
                    userId,
                    task: {
                        organizationId,
                        lifecycleStatus: client_1.TaskLifecycleStatus.COMPLETED,
                    },
                },
            }),
        ]);
        const clockInsMonth = monthRows.filter((h) => h.type === 'CLOCK_IN');
        const clockOutsMonth = monthRows.filter((h) => h.type === 'CLOCK_OUT');
        let totalMs = 0;
        for (const out of clockOutsMonth) {
            const outTime = out.timestamp;
            const dayKey = this.toLocalDateKey(outTime);
            const matchIn = clockInsMonth.find((ci) => ci.taskId === out.taskId && this.toLocalDateKey(ci.timestamp) === dayKey);
            if (matchIn) {
                totalMs += outTime.getTime() - matchIn.timestamp.getTime();
            }
        }
        const totalHours = Math.floor(totalMs / 3_600_000);
        const activeDays = new Set(clockInsMonth.map((h) => this.toLocalDateKey(h.timestamp))).size;
        const allDates = new Set(allClockIns.map((h) => this.toLocalDateKey(h.timestamp)));
        let streakDays = 0;
        for (let i = 0; i <= 60; i++) {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            if (allDates.has(d.toDateString())) {
                streakDays++;
            }
            else if (i === 0) {
                continue;
            }
            else {
                break;
            }
        }
        return {
            totalHours,
            activeDays,
            tasksCompleted: completedAssignments,
            streakDays,
        };
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                timezone: true,
                organizationId: true,
            },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const { organizationId, ...rest } = user;
        const rel = await this.decisionIntelligence.computeReliability(userId, organizationId);
        return {
            ...rest,
            reliability_score: rel.reliability_score,
            reliability_category: rel.category,
            reliability_badge: rel.badge,
        };
    }
    async getLeaveSummary(userId) {
        const [pending, approved, rejected, total] = await Promise.all([
            this.prisma.leave.count({ where: { userId, status: 'PENDING' } }),
            this.prisma.leave.count({ where: { userId, status: 'APPROVED' } }),
            this.prisma.leave.count({ where: { userId, status: 'REJECTED' } }),
            this.prisma.leave.count({ where: { userId } }),
        ]);
        return { pending, approved, rejected, total };
    }
    async getLeaves(userId) {
        return this.prisma.leave.findMany({
            where: { userId },
            orderBy: { startDate: 'desc' },
        });
    }
    async createLeave(userId, data) {
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        if (end.getTime() < start.getTime()) {
            throw new common_1.BadRequestException('End date must be on or after start date');
        }
        const trimmed = data.reason?.trim();
        if (!trimmed)
            throw new common_1.BadRequestException('Reason is required');
        return this.prisma.leave.create({
            data: {
                type: data.type,
                startDate: start,
                endDate: end,
                reason: trimmed,
                user: { connect: { id: userId } },
            },
        });
    }
    async cancelLeave(leaveId, userId) {
        const leave = await this.prisma.leave.findUnique({ where: { id: leaveId } });
        if (!leave)
            throw new common_1.NotFoundException('Leave request not found');
        if (leave.userId !== userId)
            throw new common_1.ForbiddenException('Not your leave request');
        if (leave.status !== 'PENDING') {
            throw new common_1.BadRequestException('Only pending leave requests can be cancelled');
        }
        await this.prisma.leave.delete({ where: { id: leaveId } });
    }
};
exports.VolunteerService = VolunteerService;
exports.VolunteerService = VolunteerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        decision_intelligence_service_1.DecisionIntelligenceService])
], VolunteerService);
//# sourceMappingURL=volunteer.service.js.map