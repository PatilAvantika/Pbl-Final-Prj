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
exports.ResourcesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const resources_repository_1 = require("./resources.repository");
const prisma_service_1 = require("../prisma/prisma.service");
const PRIVILEGED = [
    client_1.Role.SUPER_ADMIN,
    client_1.Role.NGO_ADMIN,
    client_1.Role.FIELD_COORDINATOR,
    client_1.Role.TEAM_LEADER,
];
let ResourcesService = class ResourcesService {
    repo;
    prisma;
    constructor(repo, prisma) {
        this.repo = repo;
        this.prisma = prisma;
    }
    list(organizationId) {
        return this.repo.findAllByOrganization(organizationId);
    }
    async create(organizationId, dto) {
        return this.prisma.resource.create({
            data: {
                name: dto.name,
                quantity: dto.quantity ?? 0,
                organization: { connect: { id: organizationId } },
            },
        });
    }
    async listAllocations(userId, role, organizationId) {
        let taskIds;
        if (role === client_1.Role.TEAM_LEADER) {
            const tasks = await this.prisma.task.findMany({
                where: {
                    organizationId,
                    OR: [
                        { teamLeaderId: userId },
                        { teamLeaderId: null, assignments: { some: { userId } } },
                    ],
                },
                select: { id: true },
            });
            taskIds = tasks.map((t) => t.id);
        }
        else {
            const tasks = await this.prisma.task.findMany({
                where: { organizationId },
                select: { id: true },
                take: 2000,
            });
            taskIds = tasks.map((t) => t.id);
        }
        if (taskIds.length === 0) {
            return [];
        }
        return this.prisma.resourceAllocation.findMany({
            where: { taskId: { in: taskIds } },
            include: {
                resource: true,
                task: { select: { id: true, title: true } },
            },
            orderBy: { id: 'desc' },
            take: 500,
        });
    }
    async allocate(actorId, role, organizationId, dto) {
        if (!PRIVILEGED.includes(role)) {
            throw new common_1.BadRequestException('Not allowed to allocate resources');
        }
        if (role === client_1.Role.TEAM_LEADER) {
            const task = await this.prisma.task.findFirst({
                where: {
                    id: dto.taskId,
                    organizationId,
                    OR: [
                        { teamLeaderId: actorId },
                        { teamLeaderId: null, assignments: { some: { userId: actorId } } },
                    ],
                },
                select: { id: true },
            });
            if (!task) {
                throw new common_1.BadRequestException('Task not found or you are not the team leader for this task');
            }
        }
        try {
            return await this.repo.allocate(organizationId, dto.resourceId, dto.taskId, dto.quantity);
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : 'Allocate failed';
            if (msg === 'Resource not found')
                throw new common_1.NotFoundException(msg);
            if (msg === 'Task not found')
                throw new common_1.NotFoundException(msg);
            throw new common_1.BadRequestException(msg);
        }
    }
};
exports.ResourcesService = ResourcesService;
exports.ResourcesService = ResourcesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [resources_repository_1.ResourcesRepository,
        prisma_service_1.PrismaService])
], ResourcesService);
//# sourceMappingURL=resources.service.js.map