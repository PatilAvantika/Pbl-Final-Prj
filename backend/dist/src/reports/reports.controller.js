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
exports.ReportsController = exports.ReportsQueryDto = exports.ApproveReportDto = exports.UpdateReportStatusDto = void 0;
const common_1 = require("@nestjs/common");
const reports_service_1 = require("./reports.service");
const client_1 = require("@prisma/client");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const class_validator_1 = require("class-validator");
const pagination_query_dto_1 = require("../common/dto/pagination-query.dto");
const audit_service_1 = require("../audit/audit.service");
const create_report_dto_1 = require("./dto/create-report.dto");
const review_report_dto_1 = require("./dto/review-report.dto");
class UpdateReportStatusDto {
    status;
    comment;
}
exports.UpdateReportStatusDto = UpdateReportStatusDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_1.ReportStatus),
    __metadata("design:type", String)
], UpdateReportStatusDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateReportStatusDto.prototype, "comment", void 0);
class ApproveReportDto {
    reportId;
    decision;
    remarks;
}
exports.ApproveReportDto = ApproveReportDto;
__decorate([
    (0, class_validator_1.IsUUID)('4'),
    __metadata("design:type", String)
], ApproveReportDto.prototype, "reportId", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['APPROVE', 'REJECT']),
    __metadata("design:type", String)
], ApproveReportDto.prototype, "decision", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ApproveReportDto.prototype, "remarks", void 0);
function requireOrganizationId(req) {
    const id = req.user?.organizationId;
    if (!id)
        throw new common_1.ForbiddenException('User is not associated with an organization');
    return id;
}
class ReportsQueryDto extends pagination_query_dto_1.PaginationQueryDto {
    taskId;
    userId;
    status;
}
exports.ReportsQueryDto = ReportsQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReportsQueryDto.prototype, "taskId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReportsQueryDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.ReportStatus),
    __metadata("design:type", String)
], ReportsQueryDto.prototype, "status", void 0);
let ReportsController = class ReportsController {
    reportsService;
    auditService;
    constructor(reportsService, auditService) {
        this.reportsService = reportsService;
        this.auditService = auditService;
    }
    create(req, dto) {
        const organizationId = requireOrganizationId(req);
        const beforePhotoUrl = dto.beforeImageUrl ?? dto.beforePhotoUrl;
        const afterPhotoUrl = dto.afterImageUrl ?? dto.afterPhotoUrl;
        const qty = dto.wasteCollected ?? dto.quantityItems;
        const quantityItems = qty === undefined || qty === null || !Number.isFinite(Number(qty))
            ? undefined
            : Math.trunc(Number(qty));
        let notes = dto.notes?.trim() ? dto.notes.trim() : undefined;
        if (dto.latitude != null &&
            dto.longitude != null &&
            Number.isFinite(dto.latitude) &&
            Number.isFinite(dto.longitude)) {
            const gps = `[GPS ${dto.latitude}, ${dto.longitude}]`;
            notes = notes ? `${notes}\n${gps}` : gps;
        }
        const data = {
            taskId: dto.taskId,
            beforePhotoUrl: beforePhotoUrl ?? undefined,
            afterPhotoUrl: afterPhotoUrl ?? undefined,
            quantityItems,
            notes,
        };
        return this.reportsService.create(req.user.id, organizationId, data);
    }
    findAll(query, req) {
        const organizationId = requireOrganizationId(req);
        return this.reportsService.findAll(query, organizationId);
    }
    findMyReports(req) {
        const organizationId = requireOrganizationId(req);
        return this.reportsService.findByUser(req.user.id, organizationId);
    }
    findForTeamLeader(req) {
        const organizationId = requireOrganizationId(req);
        return this.reportsService.findForTeamLeader(req.user.id, organizationId);
    }
    findByTask(taskId, req) {
        const organizationId = requireOrganizationId(req);
        return this.reportsService.findByTask(taskId, organizationId);
    }
    async reviewAsTeamLeader(id, dto, req) {
        const organizationId = requireOrganizationId(req);
        const report = await this.reportsService.reviewByTeamLeader(id, dto.status, req.user.id, organizationId);
        await this.auditService.log({
            actorId: req.user?.id,
            action: client_1.AuditAction.REPORT_STATUS_UPDATED,
            entityType: 'FieldReport',
            entityId: id,
            metadata: { status: report.status, via: 'team-leader-review' },
        });
        return report;
    }
    findOne(id, req) {
        const organizationId = requireOrganizationId(req);
        return this.reportsService.findOne(id, organizationId);
    }
    async updateStatus(id, data, req) {
        const organizationId = requireOrganizationId(req);
        const report = await this.reportsService.updateStatus(id, data.status, req.user.id, organizationId);
        await this.auditService.log({
            actorId: req.user?.id,
            action: client_1.AuditAction.REPORT_STATUS_UPDATED,
            entityType: 'FieldReport',
            entityId: id,
            metadata: { status: data.status, comment: data.comment || null },
        });
        return report;
    }
    async approve(body, req) {
        const organizationId = requireOrganizationId(req);
        const status = body.decision === 'APPROVE' ? client_1.ReportStatus.APPROVED : client_1.ReportStatus.REJECTED;
        const report = await this.reportsService.updateStatus(body.reportId, status, req.user.id, organizationId);
        await this.auditService.log({
            actorId: req.user?.id,
            action: client_1.AuditAction.REPORT_STATUS_UPDATED,
            entityType: 'FieldReport',
            entityId: body.reportId,
            metadata: { status, remarks: body.remarks ?? null },
        });
        return report;
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_report_dto_1.CreateReportDto]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "create", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN, client_1.Role.NGO_ADMIN, client_1.Role.FIELD_COORDINATOR, client_1.Role.TEAM_LEADER),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ReportsQueryDto, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('my-reports'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "findMyReports", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.TEAM_LEADER),
    (0, common_1.Get)('team-leader'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "findForTeamLeader", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN, client_1.Role.NGO_ADMIN, client_1.Role.FIELD_COORDINATOR, client_1.Role.TEAM_LEADER),
    (0, common_1.Get)('task/:taskId'),
    __param(0, (0, common_1.Param)('taskId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "findByTask", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.TEAM_LEADER),
    (0, common_1.Patch)(':id/review'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, review_report_dto_1.ReviewReportDto, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "reviewAsTeamLeader", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN, client_1.Role.NGO_ADMIN, client_1.Role.FIELD_COORDINATOR, client_1.Role.TEAM_LEADER),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "findOne", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN, client_1.Role.NGO_ADMIN, client_1.Role.FIELD_COORDINATOR, client_1.Role.TEAM_LEADER),
    (0, common_1.Put)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateReportStatusDto, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "updateStatus", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.TEAM_LEADER, client_1.Role.SUPER_ADMIN, client_1.Role.NGO_ADMIN, client_1.Role.FIELD_COORDINATOR),
    (0, common_1.Post)('approve'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ApproveReportDto, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "approve", null);
exports.ReportsController = ReportsController = __decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, common_1.Controller)('reports'),
    __metadata("design:paramtypes", [reports_service_1.ReportsService,
        audit_service_1.AuditService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map