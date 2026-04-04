import { AuditAction } from '@prisma/client';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { AuditService } from './audit.service';
import type { Response } from 'express';
declare class AuditQueryDto extends PaginationQueryDto {
    actorId?: string;
    action?: AuditAction;
    entityType?: string;
    entityId?: string;
}
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    findAll(query: AuditQueryDto): Promise<({
        actor: {
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.Role;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        actorId: string | null;
        action: import("@prisma/client").$Enums.AuditAction;
        entityType: string;
        entityId: string;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        createdAt: Date;
    })[]>;
    exportCsv(query: AuditQueryDto, res: Response): Promise<void>;
}
export {};
