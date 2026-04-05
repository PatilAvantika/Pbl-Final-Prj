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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const tasks_service_1 = require("../tasks/tasks.service");
let ReportsService = class ReportsService {
    prisma;
    tasksService;
    constructor(prisma, tasksService) {
        this.prisma = prisma;
        this.tasksService = tasksService;
    }
    async create(userId, data) {
        await this.tasksService.assertUserAssignedToTask(userId, data.taskId);
        await this.tasksService.findOne(data.taskId);
        return this.prisma.fieldReport.create({
            data: {
                ...data,
                userId
            }
        });
    }
    async findAll(query = {}) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;
        return this.prisma.fieldReport.findMany({
            where: {
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
    async findOne(id) {
        const report = await this.prisma.fieldReport.findUnique({
            where: { id },
            include: { task: true, user: true, approvedBy: true }
        });
        if (!report)
            throw new common_1.NotFoundException('Report not found');
        return report;
    }
    async findByTask(taskId) {
        return this.prisma.fieldReport.findMany({
            where: { taskId },
            include: { user: { select: { firstName: true, lastName: true, role: true } } },
            orderBy: { timestamp: 'desc' }
        });
    }
    async findByUser(userId) {
        return this.prisma.fieldReport.findMany({
            where: { userId },
            include: { task: true },
            orderBy: { timestamp: 'desc' }
        });
    }
    async updateStatus(reportId, status, approverId) {
        await this.findOne(reportId);
        return this.prisma.fieldReport.update({
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
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        tasks_service_1.TasksService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map