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
exports.TasksController = exports.TasksQueryDto = exports.AssignUserDto = exports.CreateTaskDto = void 0;
const common_1 = require("@nestjs/common");
const tasks_service_1 = require("./tasks.service");
const client_1 = require("@prisma/client");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const class_validator_1 = require("class-validator");
const pagination_query_dto_1 = require("../common/dto/pagination-query.dto");
const audit_service_1 = require("../audit/audit.service");
class CreateTaskDto {
    title;
    description;
    template;
    zoneName;
    geofenceLat;
    geofenceLng;
    geofenceRadius;
    startTime;
    endTime;
    isActive;
}
exports.CreateTaskDto = CreateTaskDto;
class AssignUserDto {
    userId;
}
exports.AssignUserDto = AssignUserDto;
class TasksQueryDto extends pagination_query_dto_1.PaginationQueryDto {
    search;
    template;
    isActive;
}
exports.TasksQueryDto = TasksQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TasksQueryDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.TaskTemplate),
    __metadata("design:type", String)
], TasksQueryDto.prototype, "template", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBooleanString)(),
    __metadata("design:type", String)
], TasksQueryDto.prototype, "isActive", void 0);
let TasksController = class TasksController {
    tasksService;
    auditService;
    constructor(tasksService, auditService) {
        this.tasksService = tasksService;
        this.auditService = auditService;
    }
    async create(data, req) {
        const parsedData = {
            ...data,
            startTime: new Date(data.startTime),
            endTime: new Date(data.endTime)
        };
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
    findAll(query) {
        return this.tasksService.findAll({
            page: query.page,
            limit: query.limit,
            search: query.search,
            template: query.template,
            isActive: query.isActive !== undefined ? query.isActive === 'true' : undefined,
        });
    }
    findMyTasks(req) {
        return this.tasksService.findAssignedToUser(req.user.id);
    }
    findOne(id, req) {
        return this.tasksService.findOneForRequester(id, req.user.id, req.user.role);
    }
    async update(id, updateTaskDto, req) {
        const task = await this.tasksService.update(id, updateTaskDto);
        await this.auditService.log({
            actorId: req.user?.id,
            action: client_1.AuditAction.TASK_UPDATED,
            entityType: 'Task',
            entityId: id,
            metadata: { changedFields: Object.keys(updateTaskDto || {}) },
        });
        return task;
    }
    async remove(id, req) {
        const task = await this.tasksService.remove(id);
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
        const assignment = await this.tasksService.assignUserToTask(taskId, data.userId);
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
        await this.tasksService.removeUserFromTask(taskId, userId);
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
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN, client_1.Role.NGO_ADMIN, client_1.Role.FIELD_COORDINATOR),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateTaskDto, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN, client_1.Role.NGO_ADMIN, client_1.Role.FIELD_COORDINATOR, client_1.Role.HR_MANAGER, client_1.Role.FINANCE_MANAGER),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TasksQueryDto]),
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
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "findOne", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN, client_1.Role.NGO_ADMIN, client_1.Role.FIELD_COORDINATOR),
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "update", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN, client_1.Role.NGO_ADMIN, client_1.Role.FIELD_COORDINATOR),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "remove", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN, client_1.Role.NGO_ADMIN, client_1.Role.FIELD_COORDINATOR),
    (0, common_1.Post)(':id/assign'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, AssignUserDto, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "assignUser", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN, client_1.Role.NGO_ADMIN, client_1.Role.FIELD_COORDINATOR),
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