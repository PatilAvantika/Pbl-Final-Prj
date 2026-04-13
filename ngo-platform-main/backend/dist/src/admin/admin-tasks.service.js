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
exports.AdminTasksService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const tasks_service_1 = require("../tasks/tasks.service");
const audit_service_1 = require("../audit/audit.service");
let AdminTasksService = class AdminTasksService {
    prisma;
    tasksService;
    auditService;
    constructor(prisma, tasksService, auditService) {
        this.prisma = prisma;
        this.tasksService = tasksService;
        this.auditService = auditService;
    }
    async list(organizationId, query) {
        const limit = Math.min(query.limit ?? 20, 100);
        const offset = query.offset ?? 0;
        const where = { organizationId };
        if (query.lifecycleStatus) {
            where.lifecycleStatus = query.lifecycleStatus;
        }
        if (query.from || query.to) {
            const from = query.from ? new Date(query.from) : undefined;
            const to = query.to ? new Date(query.to) : undefined;
            if (from && Number.isNaN(from.getTime())) {
                throw new common_1.BadRequestException('Invalid "from" date');
            }
            if (to && Number.isNaN(to.getTime())) {
                throw new common_1.BadRequestException('Invalid "to" date');
            }
            if (from && to) {
                where.AND = [{ startTime: { lte: to } }, { endTime: { gte: from } }];
            }
            else if (from) {
                where.endTime = { gte: from };
            }
            else if (to) {
                where.startTime = { lte: to };
            }
        }
        if (query.search?.trim()) {
            const s = query.search.trim();
            where.OR = [
                { title: { contains: s, mode: 'insensitive' } },
                { zoneName: { contains: s, mode: 'insensitive' } },
            ];
        }
        if (query.template) {
            where.template = query.template;
        }
        if (query.isActive !== undefined) {
            where.isActive = query.isActive === 'true';
        }
        const [rows, total] = await Promise.all([
            this.prisma.task.findMany({
                where,
                skip: offset,
                take: limit,
                orderBy: { startTime: 'desc' },
                include: { _count: { select: { assignments: true } } },
            }),
            this.prisma.task.count({ where }),
        ]);
        const tasks = rows.map((t) => ({
            id: t.id,
            title: t.title,
            locationName: t.zoneName,
            status: t.lifecycleStatus,
            template: t.template,
            assignmentsCount: t._count.assignments,
            startTime: t.startTime,
            endTime: t.endTime,
            isActive: t.isActive,
            geofenceLat: t.geofenceLat,
            geofenceLng: t.geofenceLng,
            geofenceRadius: t.geofenceRadius,
            description: t.description,
        }));
        return { tasks, total, limit, offset };
    }
    async findOne(organizationId, id) {
        return this.tasksService.findOneInOrganization(id, organizationId);
    }
    async replaceAssignments(taskId, organizationId, userIds) {
        await this.tasksService.findOneInOrganization(taskId, organizationId);
        if (userIds.length === 0) {
            await this.prisma.taskAssignment.deleteMany({ where: { taskId } });
            return;
        }
        const users = await this.prisma.user.findMany({
            where: { id: { in: userIds }, organizationId },
            select: { id: true },
        });
        if (users.length !== userIds.length) {
            throw new common_1.BadRequestException('One or more users are not in your organization');
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.taskAssignment.deleteMany({ where: { taskId } });
            await tx.taskAssignment.createMany({
                data: userIds.map((userId) => ({ userId, taskId })),
                skipDuplicates: true,
            });
        });
    }
    async patch(organizationId, taskId, dto, actorId) {
        const { assignedUserIds, lifecycleStatus, ...scalarRest } = dto;
        if (assignedUserIds !== undefined) {
            await this.replaceAssignments(taskId, organizationId, assignedUserIds);
        }
        const prismaUpdate = {};
        const sr = scalarRest;
        for (const key of [
            'title',
            'description',
            'template',
            'zoneName',
            'geofenceLat',
            'geofenceLng',
            'geofenceRadius',
            'startTime',
            'endTime',
            'isActive',
        ]) {
            if (sr[key] !== undefined) {
                prismaUpdate[key] = sr[key];
            }
        }
        if (lifecycleStatus !== undefined) {
            prismaUpdate.lifecycleStatus = lifecycleStatus;
        }
        let task;
        if (Object.keys(prismaUpdate).length > 0) {
            task = await this.tasksService.update(taskId, organizationId, prismaUpdate);
        }
        else {
            task = await this.tasksService.findOneInOrganization(taskId, organizationId);
        }
        await this.auditService.log({
            actorId,
            action: client_1.AuditAction.TASK_UPDATED,
            entityType: 'Task',
            entityId: taskId,
            metadata: {
                assignedUserIdsUpdated: assignedUserIds !== undefined,
                fields: Object.keys(prismaUpdate),
            },
        });
        return task;
    }
    async softDelete(organizationId, taskId, actorId) {
        const existing = await this.tasksService.findOneInOrganization(taskId, organizationId);
        const task = await this.prisma.task.update({
            where: { id: taskId },
            data: {
                lifecycleStatus: client_1.TaskLifecycleStatus.CANCELLED,
                isActive: false,
            },
        });
        await this.auditService.log({
            actorId,
            action: client_1.AuditAction.TASK_DELETED,
            entityType: 'Task',
            entityId: taskId,
            metadata: { title: existing.title, soft: true },
        });
        return task;
    }
};
exports.AdminTasksService = AdminTasksService;
exports.AdminTasksService = AdminTasksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        tasks_service_1.TasksService,
        audit_service_1.AuditService])
], AdminTasksService);
//# sourceMappingURL=admin-tasks.service.js.map