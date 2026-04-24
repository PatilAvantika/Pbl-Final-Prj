import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { AuditAction, Role } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { AuditService } from './audit.service';
import type { Response } from 'express';

class AuditQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  actorId?: string;

  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsString()
  entityId?: string;
}

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.HR_MANAGER, Role.FIELD_COORDINATOR)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  findAll(@Query() query: AuditQueryDto) {
    return this.auditService.findAll(query);
  }

  @Get('export.csv')
  async exportCsv(@Query() query: AuditQueryDto, @Res() res: Response) {
    const logs = await this.auditService.findAll({ ...query, limit: query.limit ?? 1000 });
    const header = ['createdAt', 'action', 'actorEmail', 'entityType', 'entityId', 'metadata'];
    const rows = logs.map((log: any) => [
      new Date(log.createdAt).toISOString(),
      log.action,
      log.actor?.email || '',
      log.entityType,
      log.entityId,
      JSON.stringify(log.metadata || {}),
    ]);
    const csv = [header.join(','), ...rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit-export-${Date.now()}.csv"`);
    res.send(csv);
  }
}
