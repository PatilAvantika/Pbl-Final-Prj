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
exports.HrController = exports.PayslipListQueryDto = exports.LeaveListQueryDto = exports.UpdateLeaveStatusDto = exports.RequestLeaveDto = void 0;
const common_1 = require("@nestjs/common");
const hr_service_1 = require("./hr.service");
const client_1 = require("@prisma/client");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const client_2 = require("@prisma/client");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const pagination_query_dto_1 = require("../common/dto/pagination-query.dto");
const common_2 = require("@nestjs/common");
const audit_service_1 = require("../audit/audit.service");
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
__decorate([
    (0, class_validator_1.IsEnum)(client_1.LeaveStatus),
    __metadata("design:type", String)
], UpdateLeaveStatusDto.prototype, "status", void 0);
class LeaveListQueryDto extends pagination_query_dto_1.PaginationQueryDto {
    status;
    userId;
}
exports.LeaveListQueryDto = LeaveListQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.LeaveStatus),
    __metadata("design:type", String)
], LeaveListQueryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LeaveListQueryDto.prototype, "userId", void 0);
class PayslipListQueryDto extends pagination_query_dto_1.PaginationQueryDto {
    userId;
    year;
    month;
}
exports.PayslipListQueryDto = PayslipListQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PayslipListQueryDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(2000),
    __metadata("design:type", Number)
], PayslipListQueryDto.prototype, "year", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PayslipListQueryDto.prototype, "month", void 0);
let HrController = class HrController {
    hrService;
    auditService;
    constructor(hrService, auditService) {
        this.hrService = hrService;
        this.auditService = auditService;
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
    getAllLeaves(query, req) {
        return this.hrService.getAllLeaves(query, {
            organizationId: req.user?.organizationId ?? null,
            role: req.user.role,
        });
    }
    cancelLeave(leaveId, req) {
        return this.hrService.cancelLeave(leaveId, req.user.id);
    }
    async updateLeaveStatus(leaveId, data, req) {
        const leave = await this.hrService.updateLeaveStatus(leaveId, data.status, {
            organizationId: req.user?.organizationId ?? null,
            role: req.user.role,
        });
        await this.auditService.log({
            actorId: req.user?.id,
            action: client_1.AuditAction.LEAVE_STATUS_UPDATED,
            entityType: 'Leave',
            entityId: leaveId,
            metadata: { status: data.status },
        });
        return leave;
    }
    getMyPayslips(req) {
        return this.hrService.getMyPayslips(req.user.id);
    }
    getAllPayslips(query) {
        return this.hrService.getAllPayslips(query);
    }
    generatePayslip(userId, year, month, req) {
        return this.hrService.generatePayslipForUser(userId, month, year).then(async (payslip) => {
            await this.auditService.log({
                actorId: req.user?.id,
                action: client_1.AuditAction.PAYSLIP_GENERATED,
                entityType: 'Payslip',
                entityId: payslip.id,
                metadata: { userId, month, year },
            });
            return payslip;
        });
    }
};
exports.HrController = HrController;
__decorate([
    (0, roles_decorator_1.Roles)(client_2.Role.VOLUNTEER),
    (0, common_1.Post)('leaves'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, RequestLeaveDto]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "requestLeave", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_2.Role.VOLUNTEER),
    (0, common_1.Get)('leaves/my-leaves'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "getMyLeaves", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_2.Role.SUPER_ADMIN, client_2.Role.HR_MANAGER, client_2.Role.NGO_ADMIN, client_2.Role.FIELD_COORDINATOR, client_2.Role.FINANCE_MANAGER),
    (0, common_1.Get)('leaves/all'),
    __param(0, (0, common_2.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [LeaveListQueryDto, Object]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "getAllLeaves", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_2.Role.VOLUNTEER),
    (0, common_1.Delete)('leaves/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "cancelLeave", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_2.Role.SUPER_ADMIN, client_2.Role.HR_MANAGER, client_2.Role.NGO_ADMIN, client_2.Role.FIELD_COORDINATOR),
    (0, common_1.Put)('leaves/:id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateLeaveStatusDto, Object]),
    __metadata("design:returntype", Promise)
], HrController.prototype, "updateLeaveStatus", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_2.Role.VOLUNTEER),
    (0, common_1.Get)('payslips/my-payslips'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "getMyPayslips", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_2.Role.SUPER_ADMIN, client_2.Role.HR_MANAGER, client_2.Role.NGO_ADMIN),
    (0, common_1.Get)('payslips/all'),
    __param(0, (0, common_2.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [PayslipListQueryDto]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "getAllPayslips", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_2.Role.SUPER_ADMIN, client_2.Role.HR_MANAGER),
    (0, common_1.Post)('payslips/generate/:userId/:year/:month'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Param)('year', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Param)('month', common_1.ParseIntPipe)),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number, Object]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "generatePayslip", null);
exports.HrController = HrController = __decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, common_1.Controller)('hr'),
    __metadata("design:paramtypes", [hr_service_1.HrService,
        audit_service_1.AuditService])
], HrController);
//# sourceMappingURL=hr.controller.js.map