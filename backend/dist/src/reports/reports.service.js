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
        await this.tasksService.findOne(data.taskId);
        return this.prisma.fieldReport.create({
            data: {
                ...data,
                userId
            }
        });
    }
    async findAll() {
        return this.prisma.fieldReport.findMany({
            include: {
                task: true,
            },
            orderBy: { timestamp: 'desc' },
        });
    }
    async findOne(id) {
        const report = await this.prisma.fieldReport.findUnique({
            where: { id },
            include: { task: true }
        });
        if (!report)
            throw new common_1.NotFoundException('Report not found');
        return report;
    }
    async findByTask(taskId) {
        return this.prisma.fieldReport.findMany({
            where: { taskId },
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
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        tasks_service_1.TasksService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map