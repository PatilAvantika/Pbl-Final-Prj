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
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const TASK_DETAIL_PRIVILEGED_ROLES = [
    client_1.Role.SUPER_ADMIN,
    client_1.Role.NGO_ADMIN,
    client_1.Role.FIELD_COORDINATOR,
    client_1.Role.HR_MANAGER,
    client_1.Role.FINANCE_MANAGER,
];
let TasksService = class TasksService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        return this.prisma.task.create({ data });
    }
    async findAll(query = {}) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;
        return this.prisma.task.findMany({
            where: {
                template: query.template,
                isActive: query.isActive,
                OR: query.search
                    ? [
                        { title: { contains: query.search, mode: 'insensitive' } },
                        { zoneName: { contains: query.search, mode: 'insensitive' } },
                    ]
                    : undefined,
            },
            include: {
                _count: { select: { assignments: true, reports: true } }
            },
            orderBy: { startTime: 'desc' },
            skip,
            take: limit,
        });
    }
    async findOne(id) {
        const task = await this.prisma.task.findUnique({
            where: { id },
            include: { assignments: { include: { user: { select: { id: true, firstName: true, lastName: true, role: true } } } } }
        });
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        return task;
    }
    async findOneForRequester(id, requesterId, requesterRole) {
        if (TASK_DETAIL_PRIVILEGED_ROLES.includes(requesterRole)) {
            return this.findOne(id);
        }
        const task = await this.prisma.task.findUnique({
            where: { id },
            include: { assignments: { include: { user: { select: { id: true, firstName: true, lastName: true, role: true } } } } }
        });
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        const isAssigned = task.assignments.some((a) => a.userId === requesterId);
        if (!isAssigned) {
            throw new common_1.ForbiddenException('Task not found or access denied');
        }
        return task;
    }
    async findAssignedToUser(userId) {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        const assignments = await this.prisma.taskAssignment.findMany({
            where: {
                userId,
                task: {
                    isActive: true,
                    startTime: { lte: endOfDay },
                    endTime: { gte: startOfDay },
                },
            },
            include: { task: true },
            orderBy: { task: { startTime: 'asc' } },
        });
        return assignments.map((a) => a.task);
    }
    async assertUserAssignedToTask(userId, taskId) {
        const assignment = await this.prisma.taskAssignment.findUnique({
            where: { userId_taskId: { userId, taskId } },
        });
        if (!assignment) {
            throw new common_1.ForbiddenException('You are not assigned to this task');
        }
    }
    async assignUserToTask(taskId, userId) {
        await this.findOne(taskId);
        const existing = await this.prisma.taskAssignment.findUnique({
            where: { userId_taskId: { userId, taskId } }
        });
        if (existing) {
            throw new common_1.ConflictException('User is already assigned to this task');
        }
        return this.prisma.taskAssignment.create({
            data: {
                taskId,
                userId
            }
        });
    }
    async removeUserFromTask(taskId, userId) {
        try {
            await this.prisma.taskAssignment.delete({
                where: { userId_taskId: { userId, taskId } }
            });
        }
        catch (e) {
            throw new common_1.NotFoundException('Assignment not found');
        }
    }
    async update(id, data) {
        await this.findOne(id);
        return this.prisma.task.update({ where: { id }, data });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.task.delete({ where: { id } });
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TasksService);
//# sourceMappingURL=tasks.service.js.map