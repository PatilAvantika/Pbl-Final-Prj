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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const app_service_1 = require("./app.service");
const prisma_service_1 = require("./prisma/prisma.service");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("./auth/roles.guard");
const roles_decorator_1 = require("./auth/roles.decorator");
const client_1 = require("@prisma/client");
const admin_dashboard_service_1 = require("./admin/admin-dashboard.service");
const admin_map_data_service_1 = require("./admin/admin-map-data.service");
function requireOrganizationId(req) {
    const id = req.user?.organizationId;
    if (!id)
        throw new common_1.ForbiddenException('User is not associated with an organization');
    return id;
}
let AppController = class AppController {
    appService;
    prisma;
    adminDashboard;
    adminMapData;
    constructor(appService, prisma, adminDashboard, adminMapData) {
        this.appService = appService;
        this.prisma = prisma;
        this.adminDashboard = adminDashboard;
        this.adminMapData = adminMapData;
    }
    getHello() {
        return this.appService.getHello();
    }
    getHealth() {
        return { status: 'ok', timestamp: new Date().toISOString() };
    }
    async getReady() {
        await this.prisma.$queryRaw `SELECT 1`;
        return { status: 'ready', timestamp: new Date().toISOString() };
    }
    async getAdminDashboard(req) {
        const organizationId = requireOrganizationId(req);
        return this.adminDashboard.getDashboardKpis(organizationId);
    }
    async getAdminMapData(req) {
        const organizationId = requireOrganizationId(req);
        return this.adminMapData.getMapData(organizationId);
    }
    async getAdminMetrics(from, to) {
        const start = from ? new Date(from) : new Date(new Date().setDate(new Date().getDate() - 30));
        const end = to ? new Date(to) : new Date();
        const now = new Date();
        const [activeTasks, volunteersOnField, reportsPending, reportsInRange, leavePending, payslipsInRange, syncFailures, recentAudit,] = await Promise.all([
            this.prisma.task.count({ where: { startTime: { lte: now }, endTime: { gte: now }, isActive: true } }),
            this.prisma.attendance.groupBy({
                by: ['userId'],
                where: { type: 'CLOCK_IN', timestamp: { gte: start, lte: end } },
            }),
            this.prisma.fieldReport.count({ where: { status: 'SUBMITTED' } }),
            this.prisma.fieldReport.count({ where: { timestamp: { gte: start, lte: end } } }),
            this.prisma.leave.count({ where: { status: 'PENDING' } }),
            this.prisma.payslip.count({
                where: {
                    OR: [
                        { year: { gt: start.getFullYear(), lt: end.getFullYear() } },
                        { year: start.getFullYear(), month: { gte: start.getMonth() + 1 } },
                        { year: end.getFullYear(), month: { lte: end.getMonth() + 1 } },
                    ],
                },
            }),
            this.prisma.attendance.count({ where: { syncStatus: { in: [client_1.SyncStatus.FAILED, client_1.SyncStatus.PENDING_SYNC] } } }),
            this.prisma.auditLog.findMany({
                take: 8,
                orderBy: { createdAt: 'desc' },
                include: { actor: { select: { firstName: true, lastName: true } } },
            }),
        ]);
        return {
            range: { from: start.toISOString(), to: end.toISOString() },
            kpis: {
                activeTasks,
                volunteersOnField: volunteersOnField.length,
                reportsPending,
                reportsInRange,
                leavePending,
                payslipsInRange,
                syncFailures,
            },
            recentActivity: recentAudit.map((log) => ({
                id: log.id,
                action: log.action,
                entityType: log.entityType,
                createdAt: log.createdAt,
                actorName: log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : 'System',
            })),
        };
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], AppController.prototype, "getHello", null);
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getHealth", null);
__decorate([
    (0, common_1.Get)('ready'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getReady", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN, client_1.Role.NGO_ADMIN, client_1.Role.FIELD_COORDINATOR, client_1.Role.HR_MANAGER, client_1.Role.FINANCE_MANAGER),
    (0, common_1.Get)('admin/dashboard'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getAdminDashboard", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN, client_1.Role.NGO_ADMIN, client_1.Role.FIELD_COORDINATOR, client_1.Role.HR_MANAGER, client_1.Role.FINANCE_MANAGER),
    (0, common_1.Get)('admin/map-data'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getAdminMapData", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN, client_1.Role.NGO_ADMIN, client_1.Role.FIELD_COORDINATOR, client_1.Role.HR_MANAGER, client_1.Role.FINANCE_MANAGER),
    (0, common_1.Get)('admin/metrics'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getAdminMetrics", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [app_service_1.AppService,
        prisma_service_1.PrismaService,
        admin_dashboard_service_1.AdminDashboardService,
        admin_map_data_service_1.AdminMapDataService])
], AppController);
//# sourceMappingURL=app.controller.js.map