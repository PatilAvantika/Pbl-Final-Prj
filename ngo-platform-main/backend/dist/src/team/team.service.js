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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let TeamService = class TeamService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listVolunteersForLeader(leaderId, organizationId) {
        const [rosterVolunteerIds, volunteers] = await Promise.all([
            this.prisma.teamRosterEntry.findMany({
                where: { leaderId },
                select: { volunteerId: true },
            }),
            this.prisma.user.findMany({
                where: { organizationId, role: client_1.Role.VOLUNTEER, isActive: true },
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
    async updateTeamRoster(leaderId, organizationId, body) {
        const desiredIds = new Set((body.volunteers ?? []).filter((v) => v.teamId != null && String(v.teamId).trim() !== '').map((v) => v.id));
        if (desiredIds.size > 0) {
            const valid = await this.prisma.user.findMany({
                where: {
                    id: { in: [...desiredIds] },
                    organizationId,
                    role: client_1.Role.VOLUNTEER,
                    isActive: true,
                },
                select: { id: true },
            });
            const validSet = new Set(valid.map((u) => u.id));
            for (const id of desiredIds) {
                if (!validSet.has(id)) {
                    throw new common_1.BadRequestException(`Volunteer ${id} is not in your organization or is not a volunteer`);
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
};
exports.TeamService = TeamService;
exports.TeamService = TeamService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TeamService);
//# sourceMappingURL=team.service.js.map