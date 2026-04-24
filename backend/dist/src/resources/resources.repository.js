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
exports.ResourcesRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ResourcesRepository = class ResourcesRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAllByOrganization(organizationId) {
        return this.prisma.resource.findMany({
            where: { organizationId },
            orderBy: { name: 'asc' },
        });
    }
    async allocate(organizationId, resourceId, taskId, quantity) {
        return this.prisma.$transaction(async (tx) => {
            const resource = await tx.resource.findFirst({
                where: { id: resourceId, organizationId },
            });
            if (!resource)
                throw new Error('Resource not found');
            if (resource.quantity < quantity)
                throw new Error('Insufficient quantity');
            const task = await tx.task.findFirst({
                where: { id: taskId, organizationId },
            });
            if (!task)
                throw new Error('Task not found');
            await tx.resource.update({
                where: { id: resourceId },
                data: { quantity: resource.quantity - quantity },
            });
            return tx.resourceAllocation.create({
                data: { resourceId, taskId, quantity },
            });
        });
    }
};
exports.ResourcesRepository = ResourcesRepository;
exports.ResourcesRepository = ResourcesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ResourcesRepository);
//# sourceMappingURL=resources.repository.js.map