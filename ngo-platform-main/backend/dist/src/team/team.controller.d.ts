import { TeamService } from './team.service';
import { PatchTeamDto } from './dto/patch-team.dto';
type AuthedReq = {
    user: {
        id: string;
        organizationId?: string | null;
    };
};
export declare class TeamController {
    private readonly teamService;
    constructor(teamService: TeamService);
    getTeam(req: AuthedReq): Promise<{
        volunteers: import("./team.service").TeamVolunteerRow[];
    }>;
    patchTeam(body: PatchTeamDto, req: AuthedReq): Promise<{
        volunteers: import("./team.service").TeamVolunteerRow[];
    }>;
}
export {};
