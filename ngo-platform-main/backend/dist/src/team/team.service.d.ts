import { PrismaService } from '../prisma/prisma.service';
import type { PatchTeamDto } from './dto/patch-team.dto';
export type TeamVolunteerRow = {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    skills: string[];
    availability?: string;
    avatarUrl?: string;
    teamId: string | null;
};
export declare class TeamService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listVolunteersForLeader(leaderId: string, organizationId: string): Promise<{
        volunteers: TeamVolunteerRow[];
    }>;
    updateTeamRoster(leaderId: string, organizationId: string, body: PatchTeamDto): Promise<{
        volunteers: TeamVolunteerRow[];
    }>;
}
