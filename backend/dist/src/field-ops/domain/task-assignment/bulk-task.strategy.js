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
exports.BulkTaskAssignmentStrategy = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../../prisma/prisma.service");
const ASSIGNABLE_ROLES = [client_1.Role.VOLUNTEER, client_1.Role.STAFF];
let BulkTaskAssignmentStrategy = class BulkTaskAssignmentStrategy {
    prisma;
    mode = 'bulk';
    constructor(prisma) {
        this.prisma = prisma;
    }
    async assign(ctx) {
        const userIds = ctx.userIds ?? [];
        if (userIds.length === 0) {
            throw new common_1.BadRequestException('bulk mode requires userIds');
        }
        const task = await this.prisma.task.findFirst({
            where: { id: ctx.taskId, organizationId: ctx.organizationId },
        });
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        const users = await this.prisma.user.findMany({
            where: {
                id: { in: userIds },
                organizationId: ctx.organizationId,
                role: { in: ASSIGNABLE_ROLES },
            },
            select: { id: true },
        });
        const ok = new Set(users.map((u) => u.id));
        for (const uid of userIds) {
            if (!ok.has(uid)) {
                throw new common_1.BadRequestException(`User ${uid} is not an assignable member of this organization`);
            }
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.taskAssignment.deleteMany({ where: { taskId: ctx.taskId } });
            for (const userId of userIds) {
                await tx.taskAssignment.create({
                    data: { taskId: ctx.taskId, userId },
                });
            }
        });
        return {
            assignedCount: userIds.length,
            message: `Assigned task to ${userIds.length} volunteer(s)`,
        };
    }
};
exports.BulkTaskAssignmentStrategy = BulkTaskAssignmentStrategy;
exports.BulkTaskAssignmentStrategy = BulkTaskAssignmentStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BulkTaskAssignmentStrategy);
//# sourceMappingURL=bulk-task.strategy.js.map