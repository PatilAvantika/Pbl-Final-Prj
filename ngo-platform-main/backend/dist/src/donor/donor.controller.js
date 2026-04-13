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
exports.DonorController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const client_1 = require("@prisma/client");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const donor_service_1 = require("./donor.service");
const donor_campaigns_query_dto_1 = require("./dto/donor-campaigns-query.dto");
const donor_reports_query_dto_1 = require("./dto/donor-reports-query.dto");
const audit_service_1 = require("../audit/audit.service");
function requireOrganizationId(user) {
    if (!user.organizationId) {
        throw new common_1.ForbiddenException('User is not associated with an organization');
    }
    return user.organizationId;
}
let DonorController = class DonorController {
    donorService;
    auditService;
    constructor(donorService, auditService) {
        this.donorService = donorService;
        this.auditService = auditService;
    }
    dashboard(req) {
        const organizationId = requireOrganizationId(req.user);
        return this.donorService.getDashboard(req.user.id, organizationId);
    }
    async campaigns(req, query) {
        const organizationId = requireOrganizationId(req.user);
        return this.donorService.getCampaigns(req.user.id, organizationId, query);
    }
    async reports(req, query) {
        const organizationId = requireOrganizationId(req.user);
        const result = await this.donorService.getReports(req.user.id, organizationId, query);
        await this.auditService.log({
            actorId: req.user.id,
            action: client_1.AuditAction.DONOR_REPORTS_LIST_VIEWED,
            entityType: 'DonorPortal',
            entityId: req.user.id,
            metadata: {
                page: query.page ?? 1,
                limit: query.limit ?? 20,
                returned: result.data.length,
                total: result.total,
            },
        });
        return result;
    }
    analytics(req) {
        const organizationId = requireOrganizationId(req.user);
        return this.donorService.getAnalytics(req.user.id, organizationId);
    }
    donationHistory(req) {
        const organizationId = requireOrganizationId(req.user);
        return this.donorService.getDonationHistory(req.user.id, organizationId);
    }
    async reportPdf(req, id) {
        const organizationId = requireOrganizationId(req.user);
        const buf = await this.donorService.getReportPdfBuffer(req.user.id, organizationId, id);
        await this.auditService.log({
            actorId: req.user.id,
            action: client_1.AuditAction.DONOR_REPORT_PDF_DOWNLOADED,
            entityType: 'FieldReport',
            entityId: id,
            metadata: {},
        });
        return new common_1.StreamableFile(buf, {
            type: 'application/pdf',
            disposition: `attachment; filename="field-report-${id}.pdf"`,
        });
    }
};
exports.DonorController = DonorController;
__decorate([
    (0, common_1.Get)('dashboard'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DonorController.prototype, "dashboard", null);
__decorate([
    (0, common_1.Get)('campaigns'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, donor_campaigns_query_dto_1.DonorCampaignsQueryDto]),
    __metadata("design:returntype", Promise)
], DonorController.prototype, "campaigns", null);
__decorate([
    (0, common_1.Get)('reports'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, donor_reports_query_dto_1.DonorReportsQueryDto]),
    __metadata("design:returntype", Promise)
], DonorController.prototype, "reports", null);
__decorate([
    (0, common_1.Get)('analytics'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DonorController.prototype, "analytics", null);
__decorate([
    (0, common_1.Get)('donation-history'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DonorController.prototype, "donationHistory", null);
__decorate([
    (0, common_1.Get)('report/:id/pdf'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DonorController.prototype, "reportPdf", null);
exports.DonorController = DonorController = __decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.DONOR),
    (0, common_1.Controller)('donor'),
    __metadata("design:paramtypes", [donor_service_1.DonorService,
        audit_service_1.AuditService])
], DonorController);
//# sourceMappingURL=donor.controller.js.map