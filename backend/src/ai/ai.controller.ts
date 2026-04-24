import { Controller, ForbiddenException, Get, Param, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AiService } from './ai.service';
import { DecisionIntelligenceService } from '../analytics/decision-intelligence.service';
import { TasksService } from '../tasks/tasks.service';

function requireOrganizationId(req: { user?: { organizationId?: string } }): string {
  const id = req.user?.organizationId;
  if (!id) throw new ForbiddenException('User is not associated with an organization');
  return id;
}

const COORDINATOR_ROLES: Role[] = [
  Role.SUPER_ADMIN,
  Role.NGO_ADMIN,
  Role.FIELD_COORDINATOR,
  Role.TEAM_LEADER,
  Role.HR_MANAGER,
  Role.FINANCE_MANAGER,
];

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly decision: DecisionIntelligenceService,
    private readonly tasksService: TasksService,
  ) {}

  @Get('reliability/:worker_id')
  async reliability(@Request() req: any, @Param('worker_id') workerId: string) {
    const organizationId = requireOrganizationId(req);
    this.decision.assertCanViewWorker(req.user.id, req.user.role, workerId);
    return this.aiService.predictReliability(workerId, organizationId);
  }

  /** Recommended volunteers for a task — admin/coordinator only. */
  @Roles(...COORDINATOR_ROLES)
  @Get('task-suggestions/:task_id')
  async taskSuggestions(@Request() req: any, @Param('task_id') taskId: string) {
    const organizationId = requireOrganizationId(req);
    return this.aiService.predictTaskSuggestions(taskId, organizationId);
  }
}
