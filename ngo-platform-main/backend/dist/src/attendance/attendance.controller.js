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
exports.AttendanceController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const attendance_service_1 = require("./attendance.service");
const clock_in_dto_1 = require("./dto/clock-in.dto");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const client_1 = require("@prisma/client");
class AttendanceOverrideDto {
    attendanceId;
    reason;
    action;
}
__decorate([
    (0, class_validator_1.IsUUID)('4'),
    __metadata("design:type", String)
], AttendanceOverrideDto.prototype, "attendanceId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AttendanceOverrideDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['APPROVE', 'REJECT', 'CORRECT']),
    __metadata("design:type", String)
], AttendanceOverrideDto.prototype, "action", void 0);
function requireOrganizationId(req) {
    const id = req.user?.organizationId;
    if (!id)
        throw new common_1.ForbiddenException('User is not associated with an organization');
    return id;
}
let AttendanceController = class AttendanceController {
    attendanceService;
    constructor(attendanceService) {
        this.attendanceService = attendanceService;
    }
    async clockIn(req, data) {
        if (data.lat === undefined || data.lat === null) {
            throw new common_1.BadRequestException('Missing latitude for geo-verified clock-in');
        }
        if (data.lng === undefined || data.lng === null) {
            throw new common_1.BadRequestException('Missing longitude for geo-verified clock-in');
        }
        const organizationId = requireOrganizationId(req);
        return this.attendanceService.clockIn(req.user.id, req.user.role, organizationId, data);
    }
    async clockOut(req, data) {
        if (data.lat === undefined || data.lat === null) {
            throw new common_1.BadRequestException('Missing latitude for geo-verified clock-out');
        }
        if (data.lng === undefined || data.lng === null) {
            throw new common_1.BadRequestException('Missing longitude for geo-verified clock-out');
        }
        const organizationId = requireOrganizationId(req);
        return this.attendanceService.clockOut(req.user.id, req.user.role, organizationId, data);
    }
    getMyAttendances(req) {
        return this.attendanceService.getMyAttendances(req.user.id);
    }
    listAttendanceForTask(taskId, req) {
        const organizationId = requireOrganizationId(req);
        return this.attendanceService.listAttendanceForTask(taskId, organizationId, req.user.id, req.user.role);
    }
    teamLive() {
        return this.attendanceService.listTeamLive();
    }
    override(req, body) {
        return this.attendanceService.recordAttendanceOverride(req.user.id, body);
    }
    getAll() {
        return this.attendanceService.getAllAttendances();
    }
};
exports.AttendanceController = AttendanceController;
__decorate([
    (0, common_1.Post)('clock-in'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, clock_in_dto_1.ClockInDto]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "clockIn", null);
__decorate([
    (0, common_1.Post)('clock-out'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, clock_in_dto_1.ClockInDto]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "clockOut", null);
__decorate([
    (0, common_1.Get)('my-history'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getMyAttendances", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.TEAM_LEADER, client_1.Role.SUPER_ADMIN, client_1.Role.NGO_ADMIN, client_1.Role.FIELD_COORDINATOR, client_1.Role.HR_MANAGER),
    (0, common_1.Get)('task/:taskId'),
    __param(0, (0, common_1.Param)('taskId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "listAttendanceForTask", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.TEAM_LEADER, client_1.Role.SUPER_ADMIN, client_1.Role.NGO_ADMIN, client_1.Role.FIELD_COORDINATOR, client_1.Role.HR_MANAGER),
    (0, common_1.Get)('team-live'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "teamLive", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.TEAM_LEADER, client_1.Role.SUPER_ADMIN, client_1.Role.NGO_ADMIN, client_1.Role.FIELD_COORDINATOR),
    (0, common_1.Post)('override'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, AttendanceOverrideDto]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "override", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN, client_1.Role.HR_MANAGER, client_1.Role.NGO_ADMIN),
    (0, common_1.Get)('all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getAll", null);
exports.AttendanceController = AttendanceController = __decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, common_1.Controller)('attendance'),
    __metadata("design:paramtypes", [attendance_service_1.AttendanceService])
], AttendanceController);
//# sourceMappingURL=attendance.controller.js.map