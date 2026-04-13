import {
    Controller,
    ForbiddenException,
    Get,
    Post,
    Body,
    Param,
    Patch,
    UseGuards,
    Request,
    Put,
    Query,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { AuditAction, Prisma, Role, ReportStatus } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { IsEnum, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { AuditService } from '../audit/audit.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ReviewReportDto } from './dto/review-report.dto';

export class UpdateReportStatusDto {
    @IsEnum(ReportStatus)
    status: ReportStatus;

    @IsOptional()
    @IsString()
    comment?: string;
}

export class ApproveReportDto {
    @IsUUID('4')
    reportId: string;

    @IsIn(['APPROVE', 'REJECT'])
    decision: 'APPROVE' | 'REJECT';

    @IsOptional()
    @IsString()
    remarks?: string;
}

function requireOrganizationId(req: { user?: { organizationId?: string } }): string {
    const id = req.user?.organizationId;
    if (!id) throw new ForbiddenException('User is not associated with an organization');
    return id;
}

export class ReportsQueryDto extends PaginationQueryDto {
    @IsOptional()
    @IsString()
    taskId?: string;

    @IsOptional()
    @IsString()
    userId?: string;

    @IsOptional()
    @IsEnum(ReportStatus)
    status?: ReportStatus;
}

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('reports')
export class ReportsController {
    constructor(
        private readonly reportsService: ReportsService,
        private readonly auditService: AuditService,
    ) { }

    @Post()
    create(@Request() req: any, @Body() dto: CreateReportDto) {
        const organizationId = requireOrganizationId(req);
        const beforePhotoUrl = dto.beforeImageUrl ?? dto.beforePhotoUrl;
        const afterPhotoUrl = dto.afterImageUrl ?? dto.afterPhotoUrl;
        const qty = dto.wasteCollected ?? dto.quantityItems;
        const quantityItems =
            qty === undefined || qty === null || !Number.isFinite(Number(qty))
                ? undefined
                : Math.trunc(Number(qty));

        let notes = dto.notes?.trim() ? dto.notes.trim() : undefined;
        if (
            dto.latitude != null &&
            dto.longitude != null &&
            Number.isFinite(dto.latitude) &&
            Number.isFinite(dto.longitude)
        ) {
            const gps = `[GPS ${dto.latitude}, ${dto.longitude}]`;
            notes = notes ? `${notes}\n${gps}` : gps;
        }

        const data: Omit<Prisma.FieldReportUncheckedCreateInput, 'userId' | 'organizationId'> = {
            taskId: dto.taskId,
            beforePhotoUrl: beforePhotoUrl ?? undefined,
            afterPhotoUrl: afterPhotoUrl ?? undefined,
            quantityItems,
            notes,
        };
        return this.reportsService.create(req.user.id, organizationId, data);
    }

    @Roles(Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.FIELD_COORDINATOR, Role.TEAM_LEADER)
    @Get()
    findAll(@Query() query: ReportsQueryDto, @Request() req: any) {
        const organizationId = requireOrganizationId(req);
        return this.reportsService.findAll(query, organizationId);
    }

    @Get('my-reports')
    findMyReports(@Request() req: any) {
        const organizationId = requireOrganizationId(req);
        return this.reportsService.findByUser(req.user.id, organizationId);
    }

    /** Pending reports on tasks this team leader is assigned to */
    @Roles(Role.TEAM_LEADER)
    @Get('team-leader')
    findForTeamLeader(@Request() req: any) {
        const organizationId = requireOrganizationId(req);
        return this.reportsService.findForTeamLeader(req.user.id, organizationId);
    }

    @Roles(Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.FIELD_COORDINATOR, Role.TEAM_LEADER)
    @Get('task/:taskId')
    findByTask(@Param('taskId') taskId: string, @Request() req: any) {
        const organizationId = requireOrganizationId(req);
        return this.reportsService.findByTask(taskId, organizationId);
    }

    @Roles(Role.TEAM_LEADER)
    @Patch(':id/review')
    async reviewAsTeamLeader(@Param('id') id: string, @Body() dto: ReviewReportDto, @Request() req: any) {
        const organizationId = requireOrganizationId(req);
        const report = await this.reportsService.reviewByTeamLeader(
            id,
            dto.status,
            req.user.id,
            organizationId,
        );
        await this.auditService.log({
            actorId: req.user?.id,
            action: AuditAction.REPORT_STATUS_UPDATED,
            entityType: 'FieldReport',
            entityId: id,
            metadata: { status: report.status, via: 'team-leader-review' },
        });
        return report;
    }

    @Roles(Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.FIELD_COORDINATOR, Role.TEAM_LEADER)
    @Get(':id')
    findOne(@Param('id') id: string, @Request() req: any) {
        const organizationId = requireOrganizationId(req);
        return this.reportsService.findOne(id, organizationId);
    }

    @Roles(Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.FIELD_COORDINATOR, Role.TEAM_LEADER)
    @Put(':id/status')
    async updateStatus(@Param('id') id: string, @Body() data: UpdateReportStatusDto, @Request() req: any) {
        const organizationId = requireOrganizationId(req);
        const report = await this.reportsService.updateStatus(id, data.status, req.user.id, organizationId);
        await this.auditService.log({
            actorId: req.user?.id,
            action: AuditAction.REPORT_STATUS_UPDATED,
            entityType: 'FieldReport',
            entityId: id,
            metadata: { status: data.status, comment: data.comment || null },
        });
        return report;
    }

    @Roles(Role.TEAM_LEADER, Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.FIELD_COORDINATOR)
    @Post('approve')
    async approve(@Body() body: ApproveReportDto, @Request() req: any) {
        const organizationId = requireOrganizationId(req);
        const status = body.decision === 'APPROVE' ? ReportStatus.APPROVED : ReportStatus.REJECTED;
        const report = await this.reportsService.updateStatus(body.reportId, status, req.user.id, organizationId);
        await this.auditService.log({
            actorId: req.user?.id,
            action: AuditAction.REPORT_STATUS_UPDATED,
            entityType: 'FieldReport',
            entityId: body.reportId,
            metadata: { status, remarks: body.remarks ?? null },
        });
        return report;
    }
}
