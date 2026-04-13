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
const task_assignment_orchestrator_service_1 = require("../field-ops/services/task-assignment-orchestrator.service");
const task_lifecycle_service_1 = require("../field-ops/services/task-lifecycle.service");
const TASK_DETAIL_PRIVILEGED_ROLES = [
    client_1.Role.SUPER_ADMIN,
    client_1.Role.NGO_ADMIN,
    client_1.Role.FIELD_COORDINATOR,
    client_1.Role.HR_MANAGER,
    client_1.Role.FINANCE_MANAGER,
];
const ASSIGN_PATCH_ROLES = [
    client_1.Role.SUPER_ADMIN,
    client_1.Role.NGO_ADMIN,
    client_1.Role.FIELD_COORDINATOR,
    client_1.Role.TEAM_LEADER,
];
let TasksService = class TasksService {
    static { TasksService_1 = this; }
    prisma;
    assignmentOrchestrator;
    taskLifecycle;
    constructor(prisma, assignmentOrchestrator, taskLifecycle) {
        this.prisma = prisma;
        this.assignmentOrchestrator = assignmentOrchestrator;
        this.taskLifecycle = taskLifecycle;
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
    async findAll(query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;
        return this.prisma.task.findMany({
            where: {
                organizationId: query.organizationId,
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
    async findOneInOrganization(id, organizationId) {
        const task = await this.prisma.task.findFirst({
            where: { id, organizationId },
            include: { assignments: { include: { user: { select: { id: true, firstName: true, lastName: true, role: true } } } } }
        });
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        return task;
    }
    assertTeamLeaderOwnsTask(task, actorId) {
        if (task.teamLeaderId) {
            if (task.teamLeaderId !== actorId) {
                throw new common_1.ForbiddenException('You can only manage tasks you lead');
            }
            return;
        }
        const assigned = task.assignments.some((a) => a.userId === actorId);
        if (!assigned) {
            throw new common_1.ForbiddenException('You can only manage tasks you lead');
        }
    }
    assertActorCanManageTaskAssignments(task, actor) {
        if (!actor)
            return;
        const privileged = [client_1.Role.SUPER_ADMIN, client_1.Role.NGO_ADMIN, client_1.Role.FIELD_COORDINATOR];
        if (privileged.includes(actor.role))
            return;
        if (actor.role === client_1.Role.TEAM_LEADER) {
            this.assertTeamLeaderOwnsTask(task, actor.id);
            return;
        }
        throw new common_1.ForbiddenException('Not allowed to modify task assignments');
    }
    supervisorRolesForTaskAttendance() {
        return [client_1.Role.SUPER_ADMIN, client_1.Role.NGO_ADMIN, client_1.Role.FIELD_COORDINATOR, client_1.Role.HR_MANAGER];
    }
    assertActorCanViewTaskAttendance(task, actorId, role) {
        if (this.supervisorRolesForTaskAttendance().includes(role))
            return;
        if (role === client_1.Role.TEAM_LEADER) {
            this.assertTeamLeaderOwnsTask(task, actorId);
            return;
        }
        throw new common_1.ForbiddenException('Not allowed to view attendance for this task');
    }
    async assertTeamLeaderOfTask(taskId, organizationId, teamLeaderId) {
        const task = (await this.prisma.task.findFirst({
            where: { id: taskId, organizationId },
            include: { assignments: true },
        }));
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        if (task.teamLeaderId != null && task.teamLeaderId !== teamLeaderId) {
            throw new common_1.ForbiddenException('You can only review reports for tasks you lead');
        }
    }
    async findTasksForTeamLeader(userId, organizationId) {
        return this.prisma.task.findMany({
            where: {
                organizationId,
                OR: [{ teamLeaderId: userId }, { teamLeaderId: null, assignments: { some: { userId } } }],
            },
            include: {
                assignments: {
                    include: {
                        user: { select: { id: true, firstName: true, lastName: true, role: true, email: true } },
                    },
                },
                _count: { select: { attendances: true, reports: true } },
            },
            orderBy: { startTime: 'desc' },
        });
    }
    async findOneForRequester(id, requesterId, requesterRole, organizationId) {
        const task = await this.prisma.task.findFirst({
            where: { id, organizationId },
            include: { assignments: { include: { user: { select: { id: true, firstName: true, lastName: true, role: true } } } } }
        });
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        if (TASK_DETAIL_PRIVILEGED_ROLES.includes(requesterRole)) {
            return task;
        }
        if (requesterRole === client_1.Role.TEAM_LEADER && task.teamLeaderId === requesterId) {
            return task;
        }
        const isAssigned = task.assignments.some((a) => a.userId === requesterId);
        if (!isAssigned) {
            throw new common_1.ForbiddenException('Task not found or access denied');
        }
        return task;
    }
    async findAssignedToUser(userId, organizationId) {
        return this.prisma.task.findMany({
            where: {
                organizationId,
                assignments: { some: { userId } },
            },
            orderBy: { startTime: 'desc' },
        });
    }
    async assertUserAssignedToTask(userId, taskId) {
        const assignment = await this.prisma.taskAssignment.findUnique({
            where: { userId_taskId: { userId, taskId } },
        });
        if (!assignment) {
            throw new common_1.ForbiddenException('You are not assigned to this task');
        }
    }
    async assignUserToTask(taskId, userId, organizationId, actor) {
        const task = await this.findOneInOrganization(taskId, organizationId);
        this.assertActorCanManageTaskAssignments(task, actor);
        const user = await this.prisma.user.findFirst({
            where: { id: userId, organizationId },
            select: { id: true, role: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (user.role !== client_1.Role.VOLUNTEER) {
            throw new common_1.BadRequestException('Only users with role VOLUNTEER can be assigned to field tasks');
        }
        const existing = await this.prisma.taskAssignment.findUnique({
            where: { userId_taskId: { userId, taskId } },
        });
        if (existing) {
            throw new common_1.ConflictException('User is already assigned to this task');
        }
        try {
            const created = await this.prisma.taskAssignment.create({
                data: {
                    taskId,
                    userId,
                },
            });
            return created;
        }
        catch (e) {
            if (e instanceof client_1.Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
                throw new common_1.ConflictException('User is already assigned to this task');
            }
            throw e;
        }
    }
    async removeUserFromTask(taskId, userId, organizationId, actor) {
        const task = await this.findOneInOrganization(taskId, organizationId);
        this.assertActorCanManageTaskAssignments(task, actor);
        try {
            await this.prisma.taskAssignment.delete({
                where: { userId_taskId: { userId, taskId } }
            });
        }
        catch (e) {
            throw new common_1.NotFoundException('Assignment not found');
        }
    }
    async update(id, organizationId, data) {
        const existing = await this.findOneInOrganization(id, organizationId);
        const start = this.effectiveDateFromUpdatePatch(data.startTime, existing.startTime);
        const end = this.effectiveDateFromUpdatePatch(data.endTime, existing.endTime);
        this.assertEndAfterStart(start, end);
        const lat = this.effectiveFloatFromUpdatePatch(data.geofenceLat, existing.geofenceLat);
        const lng = this.effectiveFloatFromUpdatePatch(data.geofenceLng, existing.geofenceLng);
        const radius = this.effectiveFloatFromUpdatePatch(data.geofenceRadius, existing.geofenceRadius);
        this.assertValidGeofence(lat, lng, radius);
        return this.prisma.task.update({ where: { id }, data });
    }
    async remove(id, organizationId) {
        await this.findOneInOrganization(id, organizationId);
        return this.prisma.task.delete({ where: { id } });
    }
    mapLegacyUiStatus(s) {
        if (!s)
            return undefined;
        const u = s.toUpperCase();
        if (u === 'IN_PROGRESS')
            return client_1.TaskLifecycleStatus.ACTIVE;
        if (u === 'PENDING')
            return client_1.TaskLifecycleStatus.PENDING;
        if (u === 'ACTIVE')
            return client_1.TaskLifecycleStatus.ACTIVE;
        if (u === 'COMPLETED')
            return client_1.TaskLifecycleStatus.COMPLETED;
        if (u === 'CANCELLED')
            return client_1.TaskLifecycleStatus.CANCELLED;
        return undefined;
    }
    async assignWithStrategy(taskId, organizationId, actorId, role, mode, userIds) {
        if (!ASSIGN_PATCH_ROLES.includes(role)) {
            throw new common_1.ForbiddenException('Not allowed to run assignment strategy');
        }
        const task = await this.findOneInOrganization(taskId, organizationId);
        if (role === client_1.Role.TEAM_LEADER) {
            this.assertTeamLeaderOwnsTask(task, actorId);
        }
        return this.assignmentOrchestrator.assign(mode, {
            taskId,
            leaderId: actorId,
            organizationId,
            userIds,
        });
    }
    patchDtoToPrismaUpdate(dto) {
        const keys = [
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
        ];
        const out = {};
        for (const k of keys) {
            const v = dto[k];
            if (v !== undefined) {
                out[k] = v;
            }
        }
        return out;
    }
    async patchTeamLeader(id, organizationId, actorId, role, dto) {
        let task = await this.findOneInOrganization(id, organizationId);
        if (role === client_1.Role.TEAM_LEADER) {
            this.assertTeamLeaderOwnsTask(task, actorId);
        }
        const { lifecycleStatus, status, assigneeIds } = dto;
        if (assigneeIds !== undefined) {
            if (!ASSIGN_PATCH_ROLES.includes(role)) {
                throw new common_1.ForbiddenException('Not allowed to change assignments');
            }
            if (assigneeIds.length === 0) {
                await this.assignmentOrchestrator.assign('open', {
                    taskId: id,
                    leaderId: actorId,
                    organizationId,
                });
            }
            else {
                await this.assignmentOrchestrator.assign('bulk', {
                    taskId: id,
                    leaderId: actorId,
                    organizationId,
                    userIds: assigneeIds,
                });
            }
            task = await this.findOneInOrganization(id, organizationId);
        }
        const targetLifecycle = lifecycleStatus ?? this.mapLegacyUiStatus(status);
        if (targetLifecycle !== undefined) {
            await this.taskLifecycle.applyTransition(task, targetLifecycle);
        }
        const rest = this.patchDtoToPrismaUpdate(dto);
        if (Object.keys(rest).length > 0) {
            return this.update(id, organizationId, rest);
        }
        return this.findOneInOrganization(id, organizationId);
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = TasksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        task_assignment_orchestrator_service_1.TaskAssignmentOrchestratorService,
        task_lifecycle_service_1.TaskLifecycleService])
], TasksService);
//# sourceMappingURL=tasks.service.js.map