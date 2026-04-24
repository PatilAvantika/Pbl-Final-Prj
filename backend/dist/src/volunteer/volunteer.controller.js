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
exports.VolunteerController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const client_1 = require("@prisma/client");
const volunteer_service_1 = require("./volunteer.service");
const volunteer_create_leave_dto_1 = require("./dto/volunteer-create-leave.dto");
function requireOrganizationId(req) {
    const id = req.user?.organizationId;
    if (!id)
        throw new common_1.ForbiddenException('User is not associated with an organization');
    return id;
}
let VolunteerController = class VolunteerController {
    volunteerService;
    constructor(volunteerService) {
        this.volunteerService = volunteerService;
    }
    getDashboard(req) {
        const organizationId = requireOrganizationId(req);
        return this.volunteerService.getDashboardStats(req.user.id, organizationId);
    }
    getProfile(req) {
        return this.volunteerService.getProfile(req.user.id);
    }
    getLeaveSummary(req) {
        return this.volunteerService.getLeaveSummary(req.user.id);
    }
    getLeaves(req) {
        return this.volunteerService.getLeaves(req.user.id);
    }
    createLeave(req, body) {
        return this.volunteerService.createLeave(req.user.id, {
            type: body.type,
            startDate: new Date(body.startDate),
            endDate: new Date(body.endDate),
            reason: body.reason,
        });
    }
    cancelLeave(leaveId, req) {
        return this.volunteerService.cancelLeave(leaveId, req.user.id);
    }
};
exports.VolunteerController = VolunteerController;
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.VOLUNTEER),
    (0, common_1.Get)('dashboard'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], VolunteerController.prototype, "getDashboard", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.VOLUNTEER),
    (0, common_1.Get)('profile'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], VolunteerController.prototype, "getProfile", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.VOLUNTEER),
    (0, common_1.Get)('leave-summary'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], VolunteerController.prototype, "getLeaveSummary", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.VOLUNTEER),
    (0, common_1.Get)('leaves'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], VolunteerController.prototype, "getLeaves", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.VOLUNTEER),
    (0, common_1.Post)('leaves'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, volunteer_create_leave_dto_1.VolunteerCreateLeaveDto]),
    __metadata("design:returntype", void 0)
], VolunteerController.prototype, "createLeave", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.VOLUNTEER),
    (0, common_1.Delete)('leaves/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], VolunteerController.prototype, "cancelLeave", null);
exports.VolunteerController = VolunteerController = __decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, common_1.Controller)('volunteer'),
    __metadata("design:paramtypes", [volunteer_service_1.VolunteerService])
], VolunteerController);
//# sourceMappingURL=volunteer.controller.js.map