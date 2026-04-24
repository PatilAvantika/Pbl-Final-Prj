import {
    Controller,
    ForbiddenException,
    Get,
    Param,
    ParseUUIDPipe,
    Query,
    Req,
    StreamableFile,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuditAction, Role } from '@prisma/client';
import type { Request } from 'express';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { DonorService } from './donor.service';
import { DonorCampaignsQueryDto } from './dto/donor-campaigns-query.dto';
import { DonorReportsQueryDto } from './dto/donor-reports-query.dto';
import { AuditService } from '../audit/audit.service';

type Authed = Request & {
    user: { id: string; email: string; role: Role; organizationId?: string };
};

function requireOrganizationId(user: Authed['user']): string {
    if (!user.organizationId) {
        throw new ForbiddenException('User is not associated with an organization');
    }
    return user.organizationId;
}

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.DONOR)
@Controller('donor')
export class DonorController {
    constructor(
        private readonly donorService: DonorService,
        private readonly auditService: AuditService,
    ) {}

    @Get('dashboard')
    dashboard(@Req() req: Authed) {
        const organizationId = requireOrganizationId(req.user);
        return this.donorService.getDashboard(req.user.id, organizationId);
    }

    @Get('campaigns')
    async campaigns(@Req() req: Authed, @Query() query: DonorCampaignsQueryDto) {
        const organizationId = requireOrganizationId(req.user);
        return this.donorService.getCampaigns(req.user.id, organizationId, query);
    }

    @Get('reports')
    async reports(@Req() req: Authed, @Query() query: DonorReportsQueryDto) {
        const organizationId = requireOrganizationId(req.user);
        const result = await this.donorService.getReports(req.user.id, organizationId, query);
        await this.auditService.log({
            actorId: req.user.id,
            action: AuditAction.DONOR_REPORTS_LIST_VIEWED,
            entityType: 'DonorPortal',
            entityId: req.user.id,
            metadata: {
                page: query.page ?? 1,
                limit: query.limit ?? 20,
                returned: result.data.length,
                total: result.total,
            },
        });
        return result;
    }

    @Get('analytics')
    analytics(@Req() req: Authed) {
        const organizationId = requireOrganizationId(req.user);
        return this.donorService.getAnalytics(req.user.id, organizationId);
    }

    @Get('donation-history')
    donationHistory(@Req() req: Authed) {
        const organizationId = requireOrganizationId(req.user);
        return this.donorService.getDonationHistory(req.user.id, organizationId);
    }

    @Get('report/:id/pdf')
    async reportPdf(@Req() req: Authed, @Param('id', ParseUUIDPipe) id: string) {
        const organizationId = requireOrganizationId(req.user);
        const buf = await this.donorService.getReportPdfBuffer(req.user.id, organizationId, id);
        await this.auditService.log({
            actorId: req.user.id,
            action: AuditAction.DONOR_REPORT_PDF_DOWNLOADED,
            entityType: 'FieldReport',
            entityId: id,
            metadata: {},
        });
        return new StreamableFile(buf, {
            type: 'application/pdf',
            disposition: `attachment; filename="field-report-${id}.pdf"`,
        });
    }
}
