import { Body, Controller, ForbiddenException, Get, Patch, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { TeamService } from './team.service';
import { PatchTeamDto } from './dto/patch-team.dto';

type AuthedReq = { user: { id: string; organizationId?: string | null } };

function requireOrganizationId(req: AuthedReq): string {
    const id = req.user?.organizationId;
    if (!id) throw new ForbiddenException('User is not associated with an organization');
    return id;
}

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('team')
export class TeamController {
    constructor(private readonly teamService: TeamService) {}

    @Roles(Role.TEAM_LEADER, Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.FIELD_COORDINATOR)
    @Get()
    getTeam(@Request() req: AuthedReq) {
        const organizationId = requireOrganizationId(req);
        return this.teamService.listVolunteersForLeader(req.user.id, organizationId);
    }

    @Roles(Role.TEAM_LEADER, Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.FIELD_COORDINATOR)
    @Patch()
    patchTeam(@Body() body: PatchTeamDto, @Request() req: AuthedReq) {
        const organizationId = requireOrganizationId(req);
        return this.teamService.updateTeamRoster(req.user.id, organizationId, body);
    }
}
