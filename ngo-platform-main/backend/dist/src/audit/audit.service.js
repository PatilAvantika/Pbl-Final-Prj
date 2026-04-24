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
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AuditService = class AuditService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async log(params) {
        return this.prisma.auditLog.create({
            data: {
                actorId: params.actorId,
                action: params.action,
                entityType: params.entityType,
                entityId: params.entityId,
                metadata: params.metadata,
            },
        });
    }
    async findAll(query = {}) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;
        return this.prisma.auditLog.findMany({
            where: {
                actorId: query.actorId,
                action: query.action,
                entityType: query.entityType,
                entityId: query.entityId,
            },
            include: {
                actor: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        });
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditService);
//# sourceMappingURL=audit.service.js.map