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
exports.TasksController = void 0;
const common_1 = require("@nestjs/common");
const tasks_service_1 = require("./tasks.service");
const client_1 = require("@prisma/client");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const audit_service_1 = require("../audit/audit.service");
const patch_task_dto_1 = require("./dto/patch-task.dto");
const task_mutations_dto_1 = require("./dto/task-mutations.dto");
function requireOrganizationId(req) {
    const id = req.user?.organizationId;
    if (!id)
        throw new common_1.ForbiddenException('User is not associated with an organization');
    return id;
}
let TasksController = class TasksController {
    tasksService;
    auditService;
    constructor(tasksService, auditService) {
        this.tasksService = tasksService;
        this.auditService = auditService;
    }
    async create(data, req) {
        const organizationId = requireOrganizationId(req);
        const { priority, maxVolunteers, ...rest } = data;
        const parsedData = {
            ...rest,
            startTime: new Date(data.startTime),
            endTime: new Date(data.endTime),
            priority: priority ?? 'MEDIUM',
            maxVolunteers: maxVolunteers ?? undefined,
            organization: { connect: { id: organizationId } },
        };
        if (req.user?.role === client_1.Role.TEAM_LEADER && req.user?.id) {
            parsedData.teamLeader = { connect: { id: req.user.id } };
        }
        const task = await this.tasksService.create(parsedData);
        await this.auditService.log({
            actorId: req.user?.id,
            action: client_1.AuditAction.TASK_CREATED,
            entityType: 'Task',
            entityId: task.id,
            metadata: { title: task.title },
        });
        return task;
    }
    findAll(query, req) {
        const organizationId = requireOrganizationId(req);
        return this.tasksService.findAll({
            page: query.page,
            limit: query.limit,
            search: query.search,
            template: query.template,
            isActive: query.isActive !== undefined ? query.isActive === 'true' : undefined,
            organizationId,
        });
    }
    findMyTasks(req) {
        const organizationId = requireOrganizationId(req);
        return this.tasksService.findAssignedToUser(req.user.id, organizationId);
    }
    findTeamLeaderTasks(req) {
        const organizationId = requireOrganizationId(req);
        return this.tasksService.findTasksForTeamLeader(req.user.id, organizationId);
    }
    findOne(id, req) {
        const organizationId = requireOrganizationId(req);
        return this.tasksService.findOneForRequester(id, req.user.id, req.user.role, organizationId);
    }
    async update(id, updateTaskDto, req) {
        const organizationId = requireOrganizationId(req);
        const task = await this.tasksService.update(id, organizationId, updateTaskDto);
        await this.auditService.log({
            actorId: req.user?.id,
            action: client_1.AuditAction.TASK_UPDATED,
            entityType: 'Task',
            entityId: id,
            metadata: { changedFields: Object.keys(updateTaskDto || {}) },
        });
        return task;
    }
    async patch(id, dto, req) {
        const organizationId = requireOrganizationId(req);
        return this.tasksService.patchTeamLeader(id, organizationId, req.user.id, req.user.role, dto);
    }
    async assignStrategy(taskId, body, req) {
        const organizationId = requireOrganizationId(req);
        return this.tasksService.assignWithStrategy(taskId, organizationId, req.user.id, req.user.role, body.mode, body.userIds);
    }
    async remove(id, req) {
        const organizationId = requireOrganizationId(req);
        const task = await this.tasksService.remove(id, organizationId);
        await this.auditService.log({
            actorId: req.user?.id,
            action: client_1.AuditAction.TASK_DELETED,
            entityType: 'Task',
            entityId: id,
            metadata: { title: task.title },
        });
        return task;
    }
    async assignUser(taskId, data, req) {
        const organizationId = requireOrganizationId(req);
        const assignment = await this.tasksService.assignUserToTask(taskId, data.userId, organizationId, {
            id: req.user.id,
            role: req.user.role,
        });
        await this.auditService.log({
            actorId: req.user?.id,
            action: client_1.AuditAction.TASK_ASSIGNED,
            entityType: 'TaskAssignment',
            entityId: assignment.id,
            metadata: { taskId, userId: data.userId },
        });
        return assignment;
    }
    async removeUser(taskId, userId, req) {
        const organizationId = requireOrganizationId(req);
        await this.tasksService.removeUserFromTask(taskId, userId, organizationId, {
            id: req.user.id,
            role: req.user.role,
        });
        await this.auditService.log({
            actorId: req.user?.id,
            action: client_1.AuditAction.TASK_UNASSIGNED,
            entityType: 'TaskAssignment',
            entityId: `${taskId}:${userId}`,
            metadata: { taskId, userId },
        });
        return { success: true };
    }
};
exports.TasksController = TasksController;
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN, client_1.Role.NGO_ADMIN, client_1.Role.FIELD_COORDINATOR, client_1.Role.TEAM_LEADER),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [task_mutations_dto_1.CreateTaskDto, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN, client_1.Role.NGO_ADMIN, client_1.Role.FIELD_COORDINATOR, client_1.Role.HR_MANAGER, client_1.Role.FINANCE_MANAGER, client_1.Role.TEAM_LEADER),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [task_mutations_dto_1.TasksQueryDto, Object]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('my-tasks'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "findMyTasks", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.TEAM_LEADER),
    (0, common_1.Get)('team-leader'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "findTeamLeaderTasks", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "findOne", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN, client_1.Role.NGO_ADMIN, client_1.Role.FIELD_COORDINATOR, client_1.Role.TEAM_LEADER),
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, task_mutations_dto_1.UpdateTaskDto, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "update", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN, client_1.Role.NGO_ADMIN, client_1.Role.FIELD_COORDINATOR, client_1.Role.TEAM_LEADER),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, patch_task_dto_1.PatchTaskDto, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "patch", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN, client_1.Role.NGO_ADMIN, client_1.Role.FIELD_COORDINATOR, client_1.Role.TEAM_LEADER),
    (0, common_1.Post)(':id/assign-strategy'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, patch_task_dto_1.AssignStrategyDto, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "assignStrategy", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN, client_1.Role.NGO_ADMIN, client_1.Role.FIELD_COORDINATOR, client_1.Role.TEAM_LEADER),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "remove", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN, client_1.Role.NGO_ADMIN, client_1.Role.FIELD_COORDINATOR, client_1.Role.TEAM_LEADER),
    (0, common_1.Post)(':id/assign'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, task_mutations_dto_1.AssignUserDto, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "assignUser", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN, client_1.Role.NGO_ADMIN, client_1.Role.FIELD_COORDINATOR, client_1.Role.TEAM_LEADER),
    (0, common_1.Delete)(':id/assign/:userId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "removeUser", null);
exports.TasksController = TasksController = __decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, common_1.Controller)('tasks'),
    __metadata("design:paramtypes", [tasks_service_1.TasksService,
        audit_service_1.AuditService])
], TasksController);
//# sourceMappingURL=tasks.controller.js.map