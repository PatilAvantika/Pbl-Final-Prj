import { Controller, ForbiddenException, Get, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { TeamLeaderService } from './team-leader.service';

function requireOrganizationId(req: { user?: { organizationId?: string } }): string {
    const id = req.user?.organizationId;
    if (!id) throw new ForbiddenException('User is not associated with an organization');
    return id;
}

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('team-leader')
export class TeamLeaderController {
    constructor(private readonly teamLeaderService: TeamLeaderService) {}

    @Roles(Role.TEAM_LEADER)
    @Get('dashboard')
    dashboard(@Request() req: any) {
        const organizationId = requireOrganizationId(req);
        return this.teamLeaderService.getDashboard(req.user.id, organizationId);
    }
}
