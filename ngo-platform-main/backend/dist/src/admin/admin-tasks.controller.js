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
exports.AdminTasksController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const client_1 = require("@prisma/client");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const admin_tasks_service_1 = require("./admin-tasks.service");
const admin_tasks_query_dto_1 = require("./dto/admin-tasks-query.dto");
const admin_patch_task_dto_1 = require("./dto/admin-patch-task.dto");
function requireOrganizationId(req) {
    const id = req.user?.organizationId;
    if (!id)
        throw new common_1.ForbiddenException('User is not associated with an organization');
    return id;
}
let AdminTasksController = class AdminTasksController {
    adminTasks;
    constructor(adminTasks) {
        this.adminTasks = adminTasks;
    }
    list(query, req) {
        const organizationId = requireOrganizationId(req);
        return this.adminTasks.list(organizationId, query);
    }
    findOne(id, req) {
        const organizationId = requireOrganizationId(req);
        return this.adminTasks.findOne(organizationId, id);
    }
    patch(id, body, req) {
        const organizationId = requireOrganizationId(req);
        return this.adminTasks.patch(organizationId, id, body, req.user?.id);
    }
    remove(id, req) {
        const organizationId = requireOrganizationId(req);
        return this.adminTasks.softDelete(organizationId, id, req.user?.id);
    }
};
exports.AdminTasksController = AdminTasksController;
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN, client_1.Role.NGO_ADMIN, client_1.Role.FIELD_COORDINATOR, client_1.Role.HR_MANAGER, client_1.Role.FINANCE_MANAGER),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_tasks_query_dto_1.AdminTasksQueryDto, Object]),
    __metadata("design:returntype", void 0)
], AdminTasksController.prototype, "list", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN, client_1.Role.NGO_ADMIN, client_1.Role.FIELD_COORDINATOR, client_1.Role.HR_MANAGER, client_1.Role.FINANCE_MANAGER),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminTasksController.prototype, "findOne", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN, client_1.Role.NGO_ADMIN, client_1.Role.FIELD_COORDINATOR, client_1.Role.HR_MANAGER, client_1.Role.FINANCE_MANAGER),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_patch_task_dto_1.AdminPatchTaskDto, Object]),
    __metadata("design:returntype", void 0)
], AdminTasksController.prototype, "patch", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN, client_1.Role.NGO_ADMIN, client_1.Role.FIELD_COORDINATOR, client_1.Role.HR_MANAGER, client_1.Role.FINANCE_MANAGER),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminTasksController.prototype, "remove", null);
exports.AdminTasksController = AdminTasksController = __decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, common_1.Controller)('admin/tasks'),
    __metadata("design:paramtypes", [admin_tasks_service_1.AdminTasksService])
], AdminTasksController);
//# sourceMappingURL=admin-tasks.controller.js.map