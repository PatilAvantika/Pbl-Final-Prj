import { Controller, ForbiddenException, Get, Param, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { DecisionIntelligenceService } from './decision-intelligence.service';

function requireOrganizationId(req: { user?: { organizationId?: string } }): string {
  const id = req.user?.organizationId;
  if (!id) throw new ForbiddenException('User is not associated with an organization');
  return id;
}

const ANALYTICS_ROLES: Role[] = [
  Role.SUPER_ADMIN,
  Role.NGO_ADMIN,
  Role.FIELD_COORDINATOR,
  Role.TEAM_LEADER,
  Role.HR_MANAGER,
  Role.FINANCE_MANAGER,
];

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly decision: DecisionIntelligenceService) {}

  /** Reliability score + category for one worker (volunteer: self only). */
  @Get('worker-reliability/:worker_id')
  async workerReliability(@Request() req: any, @Param('worker_id') workerId: string) {
    const organizationId = requireOrganizationId(req);
    this.decision.assertCanViewWorker(req.user.id, req.user.role, workerId);
    return this.decision.computeReliability(workerId, organizationId);
  }

  @Roles(...ANALYTICS_ROLES)
  @Get('at-risk-workers')
  async atRiskWorkers(@Request() req: any) {
    const organizationId = requireOrganizationId(req);
    return this.decision.listAtRiskWorkers(organizationId);
  }

  @Roles(...ANALYTICS_ROLES)
  @Get('absence-risk')
  async absenceRisk(@Request() req: any) {
    const organizationId = requireOrganizationId(req);
    return this.decision.listAbsenceRisk(organizationId);
  }
}
