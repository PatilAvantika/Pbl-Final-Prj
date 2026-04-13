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
exports.AdminDashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let AdminDashboardService = class AdminDashboardService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    userHasOpenClockInToday(rows, dayStartUtc, dayEndUtc) {
        let openTaskId = null;
        let openedAt = null;
        for (const r of rows) {
            if (!r.taskId)
                continue;
            if (r.type === 'CLOCK_IN') {
                openTaskId = r.taskId;
                openedAt = r.timestamp;
            }
            else if (r.type === 'CLOCK_OUT' && openTaskId !== null && r.taskId === openTaskId) {
                openTaskId = null;
                openedAt = null;
            }
        }
        if (openTaskId === null || openedAt === null)
            return false;
        const t = openedAt.getTime();
        return t >= dayStartUtc.getTime() && t <= dayEndUtc.getTime();
    }
    async getDashboardKpis(organizationId) {
        const now = new Date();
        const dayStartUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
        const dayEndUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
        const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const lookback = new Date(dayStartUtc);
        lookback.setUTCDate(lookback.getUTCDate() - 1);
        const [activeTasks, reportsPending, syncFailures, orgUsers] = await Promise.all([
            this.prisma.task.count({
                where: {
                    organizationId,
                    isActive: true,
                    lifecycleStatus: client_1.TaskLifecycleStatus.ACTIVE,
                    startTime: { lte: now },
                    endTime: { gte: now },
                },
            }),
            this.prisma.fieldReport.count({
                where: { organizationId, status: 'SUBMITTED' },
            }),
            this.prisma.attendance.count({
                where: {
                    syncStatus: client_1.SyncStatus.FAILED,
                    timestamp: { gte: since24h },
                    user: { organizationId },
                },
            }),
            this.prisma.user.findMany({
                where: { organizationId, isActive: true },
                select: { id: true },
            }),
        ]);
        const userIds = orgUsers.map((u) => u.id);
        let volunteersOnField = 0;
        if (userIds.length > 0) {
            const rows = await this.prisma.attendance.findMany({
                where: { userId: { in: userIds }, timestamp: { gte: lookback } },
                orderBy: { timestamp: 'asc' },
                select: { userId: true, taskId: true, type: true, timestamp: true },
            });
            const byUser = new Map();
            for (const r of rows) {
                const list = byUser.get(r.userId) ?? [];
                list.push(r);
                byUser.set(r.userId, list);
            }
            for (const uid of userIds) {
                if (this.userHasOpenClockInToday(byUser.get(uid) ?? [], dayStartUtc, dayEndUtc)) {
                    volunteersOnField += 1;
                }
            }
        }
        return { activeTasks, volunteersOnField, reportsPending, syncFailures };
    }
};
exports.AdminDashboardService = AdminDashboardService;
exports.AdminDashboardService = AdminDashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminDashboardService);
//# sourceMappingURL=admin-dashboard.service.js.map