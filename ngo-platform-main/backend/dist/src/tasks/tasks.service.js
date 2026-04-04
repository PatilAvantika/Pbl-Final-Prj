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
var TasksService_1;
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
    static { TasksService_1 = this; }
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    assertEndAfterStart(start, end) {
        if (end.getTime() <= start.getTime()) {
            throw new common_1.BadRequestException('endTime must be after startTime');
        }
    }
    static GEOFENCE_ERR = 'Invalid task geofence:';
    requireFiniteCreateScalar(value, label) {
        if (typeof value === 'number' && Number.isFinite(value)) {
            return value;
        }
        throw new common_1.BadRequestException(`${TasksService_1.GEOFENCE_ERR} ${label} must be a finite number.`);
    }
    assertValidGeofence(lat, lng, radius) {
        const p = TasksService_1.GEOFENCE_ERR;
        if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
            throw new common_1.BadRequestException(`${p} latitude out of range (allowed -90 to 90, inclusive).`);
        }
        if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
            throw new common_1.BadRequestException(`${p} longitude out of range (allowed -180 to 180, inclusive).`);
        }
        if (!Number.isFinite(radius) || radius <= 0) {
            throw new common_1.BadRequestException(`${p} radius must be greater than 0.`);
        }
    }
    effectiveFloatFromUpdatePatch(patch, current) {
        if (patch === undefined || patch === null) {
            return current;
        }
        if (typeof patch === 'number') {
            return patch;
        }
        if (typeof patch === 'object' && patch !== null && 'set' in patch) {
            const v = patch.set;
            return typeof v === 'number' ? v : current;
        }
        return current;
    }
    toDate(value) {
        return value instanceof Date ? value : new Date(value);
    }
    effectiveDateFromUpdatePatch(patch, current) {
        if (patch === undefined || patch === null) {
            return current;
        }
        if (patch instanceof Date) {
            return patch;
        }
        if (typeof patch === 'string') {
            return new Date(patch);
        }
        if (typeof patch === 'object' && patch !== null && 'set' in patch) {
            const s = patch.set;
            return s instanceof Date ? s : new Date(s);
        }
        return current;
    }
    async create(data) {
        const start = this.toDate(data.startTime);
        const end = this.toDate(data.endTime);
        this.assertEndAfterStart(start, end);
        this.assertValidGeofence(this.requireFiniteCreateScalar(data.geofenceLat, 'latitude (geofenceLat)'), this.requireFiniteCreateScalar(data.geofenceLng, 'longitude (geofenceLng)'), this.requireFiniteCreateScalar(data.geofenceRadius, 'radius (geofenceRadius)'));
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
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const existing = await this.prisma.taskAssignment.findUnique({
            where: { userId_taskId: { userId, taskId } },
        });
        if (existing) {
            throw new common_1.ConflictException('User is already assigned to this task');
        }
        try {
            return await this.prisma.taskAssignment.create({
                data: {
                    taskId,
                    userId,
                },
            });
        }
        catch (e) {
            if (e instanceof client_1.Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
                throw new common_1.ConflictException('User is already assigned to this task');
            }
            throw e;
        }
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
        const existing = await this.findOne(id);
        const start = this.effectiveDateFromUpdatePatch(data.startTime, existing.startTime);
        const end = this.effectiveDateFromUpdatePatch(data.endTime, existing.endTime);
        this.assertEndAfterStart(start, end);
        const lat = this.effectiveFloatFromUpdatePatch(data.geofenceLat, existing.geofenceLat);
        const lng = this.effectiveFloatFromUpdatePatch(data.geofenceLng, existing.geofenceLng);
        const radius = this.effectiveFloatFromUpdatePatch(data.geofenceRadius, existing.geofenceRadius);
        this.assertValidGeofence(lat, lng, radius);
        return this.prisma.task.update({ where: { id }, data });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.task.delete({ where: { id } });
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = TasksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TasksService);
//# sourceMappingURL=tasks.service.js.map