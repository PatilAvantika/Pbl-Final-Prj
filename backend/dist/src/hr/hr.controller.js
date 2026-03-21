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
exports.HrController = exports.UpdateLeaveStatusDto = exports.RequestLeaveDto = void 0;
const common_1 = require("@nestjs/common");
const hr_service_1 = require("./hr.service");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const client_1 = require("@prisma/client");
class RequestLeaveDto {
    type;
    startDate;
    endDate;
    reason;
}
exports.RequestLeaveDto = RequestLeaveDto;
class UpdateLeaveStatusDto {
    status;
}
exports.UpdateLeaveStatusDto = UpdateLeaveStatusDto;
let HrController = class HrController {
    hrService;
    constructor(hrService) {
        this.hrService = hrService;
    }
    requestLeave(req, data) {
        return this.hrService.requestLeave(req.user.id, {
            type: data.type,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
            reason: data.reason
        });
    }
    getMyLeaves(req) {
        return this.hrService.getMyLeaves(req.user.id);
    }
    getAllLeaves() {
        return this.hrService.getAllLeaves();
    }
    updateLeaveStatus(leaveId, data) {
        return this.hrService.updateLeaveStatus(leaveId, data.status);
    }
    getMyPayslips(req) {
        return this.hrService.getMyPayslips(req.user.id);
    }
    getAllPayslips() {
        return this.hrService.getAllPayslips();
    }
    generatePayslip(userId, year, month) {
        return this.hrService.generatePayslipForUser(userId, month, year);
    }
};
exports.HrController = HrController;
__decorate([
    (0, common_1.Post)('leaves'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, RequestLeaveDto]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "requestLeave", null);
__decorate([
    (0, common_1.Get)('leaves/my-leaves'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "getMyLeaves", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN, client_1.Role.HR_MANAGER, client_1.Role.NGO_ADMIN),
    (0, common_1.Get)('leaves/all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HrController.prototype, "getAllLeaves", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN, client_1.Role.HR_MANAGER, client_1.Role.NGO_ADMIN),
    (0, common_1.Put)('leaves/:id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateLeaveStatusDto]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "updateLeaveStatus", null);
__decorate([
    (0, common_1.Get)('payslips/my-payslips'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "getMyPayslips", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN, client_1.Role.HR_MANAGER, client_1.Role.NGO_ADMIN),
    (0, common_1.Get)('payslips/all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HrController.prototype, "getAllPayslips", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN, client_1.Role.HR_MANAGER),
    (0, common_1.Post)('payslips/generate/:userId/:year/:month'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Param)('year', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Param)('month', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "generatePayslip", null);
exports.HrController = HrController = __decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, common_1.Controller)('hr'),
    __metadata("design:paramtypes", [hr_service_1.HrService])
], HrController);
//# sourceMappingURL=hr.controller.js.map