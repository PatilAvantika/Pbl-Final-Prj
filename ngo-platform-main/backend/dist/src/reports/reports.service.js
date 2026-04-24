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
var ReportsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const tasks_service_1 = require("../tasks/tasks.service");
const donor_cache_service_1 = require("../donor/donor-cache.service");
const report_queue_service_1 = require("../queue/report-queue.service");
let ReportsService = ReportsService_1 = class ReportsService {
    prisma;
    tasksService;
    donorCache;
    reportQueue;
    logger = new common_1.Logger(ReportsService_1.name);
    constructor(prisma, tasksService, donorCache, reportQueue) {
        this.prisma = prisma;
        this.tasksService = tasksService;
        this.donorCache = donorCache;
        this.reportQueue = reportQueue;
    }
    async create(userId, organizationId, data) {
        await this.tasksService.assertUserAssignedToTask(userId, data.taskId);
        const task = await this.tasksService.findOneInOrganization(data.taskId, organizationId);
        const report = await this.prisma.fieldReport.create({
            data: {
                ...data,
                userId,
                organizationId: task.organizationId,
            },
        });
        this.logger.log(`field report created reportId=${report.id} userId=${userId} taskId=${data.taskId}`);
        await this.reportQueue.enqueueReportProcessing(report.id);
        return report;
    }
    async findAll(query = {}, organizationId) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;
        return this.prisma.fieldReport.findMany({
            where: {
                organizationId,
                taskId: query.taskId,
                userId: query.userId,
                status: query.status,
            },
            include: {
                task: true,
                user: { select: { firstName: true, lastName: true, role: true } },
                approvedBy: { select: { firstName: true, lastName: true, role: true } },
            },
            orderBy: { timestamp: 'desc' },
            skip,
            take: limit,
        });
    }
    async findOne(id, organizationId) {
        const report = await this.prisma.fieldReport.findFirst({
            where: { id, organizationId },
            include: { task: true, user: true, approvedBy: true },
        });
        if (!report)
            throw new common_1.NotFoundException('Report not found');
        return report;
    }
    async findByTask(taskId, organizationId) {
        await this.tasksService.findOneInOrganization(taskId, organizationId);
        return this.prisma.fieldReport.findMany({
            where: { taskId, organizationId },
            include: { user: { select: { firstName: true, lastName: true, role: true } } },
            orderBy: { timestamp: 'desc' },
        });
    }
    async findByUser(userId, organizationId) {
        return this.prisma.fieldReport.findMany({
            where: { userId, organizationId },
            include: { task: true },
            orderBy: { timestamp: 'desc' },
        });
    }
    async findForTeamLeader(teamLeaderId, organizationId) {
        const tasks = await this.prisma.task.findMany({
            where: {
                organizationId,
                OR: [{ teamLeaderId: teamLeaderId }, { teamLeaderId: null }],
            },
            select: { id: true },
        });
        const taskIds = tasks.map((t) => t.id);
        if (taskIds.length === 0) {
            return [];
        }
        return this.prisma.fieldReport.findMany({
            where: { organizationId, taskId: { in: taskIds } },
            include: {
                task: true,
                user: { select: { firstName: true, lastName: true, email: true, role: true } },
            },
            orderBy: { timestamp: 'desc' },
        });
    }
    async reviewByTeamLeader(reportId, status, teamLeaderId, organizationId) {
        const report = await this.findOne(reportId, organizationId);
        if (report.status !== client_1.ReportStatus.SUBMITTED) {
            throw new common_1.BadRequestException('Only submitted reports can be reviewed');
        }
        await this.tasksService.assertTeamLeaderOfTask(report.taskId, organizationId, teamLeaderId);
        const nextStatus = status === 'APPROVED' ? client_1.ReportStatus.APPROVED : client_1.ReportStatus.REJECTED;
        return this.updateStatus(reportId, nextStatus, teamLeaderId, organizationId);
    }
    async updateStatus(reportId, status, approverId, approverOrganizationId) {
        await this.findOne(reportId, approverOrganizationId);
        const report = await this.prisma.fieldReport.update({
            where: { id: reportId },
            data: {
                status,
                approvedById: approverId,
                approvedAt: new Date(),
            },
            include: {
                task: true,
                user: { select: { firstName: true, lastName: true, role: true } },
                approvedBy: { select: { firstName: true, lastName: true, role: true } },
            },
        });
        if (status === client_1.ReportStatus.APPROVED) {
            await this.donorCache.invalidateDashboardForReport(reportId);
        }
        return report;
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = ReportsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        tasks_service_1.TasksService,
        donor_cache_service_1.DonorCacheService,
        report_queue_service_1.ReportQueueService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map