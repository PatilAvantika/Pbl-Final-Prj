import { Controller, ForbiddenException, Get, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { DecisionIntelligenceService } from '../analytics/decision-intelligence.service';

function requireOrganizationId(req: { user?: { organizationId?: string } }): string {
  const id = req.user?.organizationId;
  if (!id) throw new ForbiddenException('User is not associated with an organization');
  return id;
}

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('alerts')
export class AlertsController {
  constructor(private readonly decision: DecisionIntelligenceService) {}

  /** Absence-triggered alerts + replacement suggestions. */
  @Roles(
    Role.SUPER_ADMIN,
    Role.NGO_ADMIN,
    Role.FIELD_COORDINATOR,
    Role.TEAM_LEADER,
    Role.HR_MANAGER,
    Role.FINANCE_MANAGER,
  )
  @Get('task-risk')
  async taskRisk(@Request() req: any) {
    const organizationId = requireOrganizationId(req);
    return this.decision.listTaskRiskAlerts(organizationId);
  }
}
