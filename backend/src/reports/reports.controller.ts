import { Controller, Get, Post, Body, Param, UseGuards, Request, Put } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { AuditAction, Prisma, Role, ReportStatus } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Query } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';

export class CreateReportDto {
    taskId: string;
    beforePhotoUrl?: string;
    afterPhotoUrl?: string;
    quantityItems?: number;
    notes?: string;
}

export class UpdateReportStatusDto {
    @IsEnum(ReportStatus)
    status: ReportStatus;

    @IsOptional()
    @IsString()
    comment?: string;
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
    create(@Request() req: any, @Body() data: CreateReportDto) {
        return this.reportsService.create(req.user.id, data as Prisma.FieldReportUncheckedCreateInput);
    }

    @Roles(Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.FIELD_COORDINATOR)
    @Get()
    findAll(@Query() query: ReportsQueryDto) {
        return this.reportsService.findAll(query);
    }

    @Get('my-reports')
    findMyReports(@Request() req: any) {
        return this.reportsService.findByUser(req.user.id);
    }

    @Roles(Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.FIELD_COORDINATOR)
    @Get('task/:taskId')
    findByTask(@Param('taskId') taskId: string) {
        return this.reportsService.findByTask(taskId);
    }

    @Roles(Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.FIELD_COORDINATOR)
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.reportsService.findOne(id);
    }

    @Roles(Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.FIELD_COORDINATOR)
    @Put(':id/status')
    async updateStatus(@Param('id') id: string, @Body() data: UpdateReportStatusDto, @Request() req: any) {
        const report = await this.reportsService.updateStatus(id, data.status, req.user.id);
        await this.auditService.log({
            actorId: req.user?.id,
            action: AuditAction.REPORT_STATUS_UPDATED,
            entityType: 'FieldReport',
            entityId: id,
            metadata: { status: data.status, comment: data.comment || null },
        });
        return report;
    }
}
