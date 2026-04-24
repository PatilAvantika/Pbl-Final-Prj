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
exports.TeamLeaderService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let TeamLeaderService = class TeamLeaderService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboard(userId, organizationId) {
        const tasks = await this.prisma.task.findMany({
            where: {
                organizationId,
                OR: [{ teamLeaderId: userId }, { teamLeaderId: null, assignments: { some: { userId } } }],
            },
            select: { id: true, lifecycleStatus: true },
        });
        const ids = tasks.map((t) => t.id);
        if (ids.length === 0) {
            return {
                totalTasks: 0,
                activeTasks: 0,
                totalVolunteers: 0,
                attendanceToday: 0,
                reportsSubmitted: 0,
                reportsPending: 0,
                reportsApproved: 0,
                reportsRejected: 0,
            };
        }
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        const totalTasks = ids.length;
        const activeTasks = tasks.filter((t) => t.lifecycleStatus === client_1.TaskLifecycleStatus.PENDING || t.lifecycleStatus === client_1.TaskLifecycleStatus.ACTIVE).length;
        const assignRows = await this.prisma.taskAssignment.findMany({
            where: { taskId: { in: ids } },
            select: { userId: true, user: { select: { role: true } } },
        });
        const volunteerIds = new Set(assignRows.filter((a) => a.user.role === client_1.Role.VOLUNTEER).map((a) => a.userId));
        const totalVolunteers = volunteerIds.size;
        const attendanceToday = await this.prisma.attendance.count({
            where: { taskId: { in: ids }, timestamp: { gte: startOfDay, lte: endOfDay } },
        });
        const [reportsSubmitted, reportsPending, reportsApproved, reportsRejected] = await Promise.all([
            this.prisma.fieldReport.count({ where: { taskId: { in: ids }, organizationId } }),
            this.prisma.fieldReport.count({
                where: { taskId: { in: ids }, organizationId, status: client_1.ReportStatus.SUBMITTED },
            }),
            this.prisma.fieldReport.count({
                where: { taskId: { in: ids }, organizationId, status: client_1.ReportStatus.APPROVED },
            }),
            this.prisma.fieldReport.count({
                where: { taskId: { in: ids }, organizationId, status: client_1.ReportStatus.REJECTED },
            }),
        ]);
        return {
            totalTasks,
            activeTasks,
            totalVolunteers,
            attendanceToday,
            reportsSubmitted,
            reportsPending,
            reportsApproved,
            reportsRejected,
        };
    }
};
exports.TeamLeaderService = TeamLeaderService;
exports.TeamLeaderService = TeamLeaderService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TeamLeaderService);
//# sourceMappingURL=team-leader.service.js.map