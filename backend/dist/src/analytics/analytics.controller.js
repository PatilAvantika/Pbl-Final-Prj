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
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const client_1 = require("@prisma/client");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const decision_intelligence_service_1 = require("./decision-intelligence.service");
function requireOrganizationId(req) {
    const id = req.user?.organizationId;
    if (!id)
        throw new common_1.ForbiddenException('User is not associated with an organization');
    return id;
}
const ANALYTICS_ROLES = [
    client_1.Role.SUPER_ADMIN,
    client_1.Role.NGO_ADMIN,
    client_1.Role.FIELD_COORDINATOR,
    client_1.Role.TEAM_LEADER,
    client_1.Role.HR_MANAGER,
    client_1.Role.FINANCE_MANAGER,
];
let AnalyticsController = class AnalyticsController {
    decision;
    constructor(decision) {
        this.decision = decision;
    }
    async workerReliability(req, workerId) {
        const organizationId = requireOrganizationId(req);
        this.decision.assertCanViewWorker(req.user.id, req.user.role, workerId);
        return this.decision.computeReliability(workerId, organizationId);
    }
    async atRiskWorkers(req) {
        const organizationId = requireOrganizationId(req);
        return this.decision.listAtRiskWorkers(organizationId);
    }
    async absenceRisk(req) {
        const organizationId = requireOrganizationId(req);
        return this.decision.listAbsenceRisk(organizationId);
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Get)('worker-reliability/:worker_id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('worker_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "workerReliability", null);
__decorate([
    (0, roles_decorator_1.Roles)(...ANALYTICS_ROLES),
    (0, common_1.Get)('at-risk-workers'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "atRiskWorkers", null);
__decorate([
    (0, roles_decorator_1.Roles)(...ANALYTICS_ROLES),
    (0, common_1.Get)('absence-risk'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "absenceRisk", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, common_1.Controller)('analytics'),
    __metadata("design:paramtypes", [decision_intelligence_service_1.DecisionIntelligenceService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map