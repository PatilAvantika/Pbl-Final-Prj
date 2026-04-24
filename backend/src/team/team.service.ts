import { BadRequestException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
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

@Injectable()
export class TeamService {
    constructor(private readonly prisma: PrismaService) {}

    async listVolunteersForLeader(leaderId: string, organizationId: string): Promise<{ volunteers: TeamVolunteerRow[] }> {
        const [rosterVolunteerIds, volunteers] = await Promise.all([
            this.prisma.teamRosterEntry.findMany({
                where: { leaderId },
                select: { volunteerId: true },
            }),
            this.prisma.user.findMany({
                where: { organizationId, role: Role.VOLUNTEER, isActive: true },
                orderBy: { lastName: 'asc' },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    department: true,
                },
            }),
        ]);
        const onRoster = new Set(rosterVolunteerIds.map((r) => r.volunteerId));

        return {
            volunteers: volunteers.map((v) => ({
                id: v.id,
                name: `${v.firstName} ${v.lastName}`.trim(),
                email: v.email,
                phone: v.phone ?? null,
                skills: v.department ? [v.department] : [],
                availability: undefined,
                avatarUrl: undefined,
                teamId: onRoster.has(v.id) ? leaderId : null,
            })),
        };
    }

    async updateTeamRoster(
        leaderId: string,
        organizationId: string,
        body: PatchTeamDto,
    ): Promise<{ volunteers: TeamVolunteerRow[] }> {
        const desiredIds = new Set(
            (body.volunteers ?? []).filter((v) => v.teamId != null && String(v.teamId).trim() !== '').map((v) => v.id),
        );

        if (desiredIds.size > 0) {
            const valid = await this.prisma.user.findMany({
                where: {
                    id: { in: [...desiredIds] },
                    organizationId,
                    role: Role.VOLUNTEER,
                    isActive: true,
                },
                select: { id: true },
            });
            const validSet = new Set(valid.map((u) => u.id));
            for (const id of desiredIds) {
                if (!validSet.has(id)) {
                    throw new BadRequestException(`Volunteer ${id} is not in your organization or is not a volunteer`);
                }
            }
        }

        await this.prisma.$transaction([
            this.prisma.teamRosterEntry.deleteMany({ where: { leaderId } }),
            ...(desiredIds.size
                ? [
                      this.prisma.teamRosterEntry.createMany({
                          data: [...desiredIds].map((volunteerId) => ({ leaderId, volunteerId })),
                          skipDuplicates: true,
                      }),
                  ]
                : []),
        ]);

        return this.listVolunteersForLeader(leaderId, organizationId);
    }
}
