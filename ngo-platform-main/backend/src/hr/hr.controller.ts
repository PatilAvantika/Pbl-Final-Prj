import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Request, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { HrService } from './hr.service';
import { AuditAction, LeaveStatus, LeaveType } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Query } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';

export class RequestLeaveDto {
    type: LeaveType;
    startDate: string | Date;
    endDate: string | Date;
    reason: string;
}

export class UpdateLeaveStatusDto {
    @IsEnum(LeaveStatus)
    status: LeaveStatus;
}

export class LeaveListQueryDto extends PaginationQueryDto {
    @IsOptional()
    @IsEnum(LeaveStatus)
    status?: LeaveStatus;

    @IsOptional()
    @IsString()
    userId?: string;
}

export class PayslipListQueryDto extends PaginationQueryDto {
    @IsOptional()
    @IsString()
    userId?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(2000)
    year?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    month?: number;
}

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('hr')
export class HrController {
    constructor(
        private readonly hrService: HrService,
        private readonly auditService: AuditService,
    ) { }

    // --- LEAVES ---
    @Roles(Role.VOLUNTEER)
    @Post('leaves')
    requestLeave(@Request() req: any, @Body() data: RequestLeaveDto) {
        return this.hrService.requestLeave(req.user.id, {
            type: data.type,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
            reason: data.reason
        } as any);
    }

    @Roles(Role.VOLUNTEER)
    @Get('leaves/my-leaves')
    getMyLeaves(@Request() req: any) {
        return this.hrService.getMyLeaves(req.user.id);
    }

    @Roles(
        Role.SUPER_ADMIN,
        Role.HR_MANAGER,
        Role.NGO_ADMIN,
        Role.FIELD_COORDINATOR,
        Role.FINANCE_MANAGER,
    )
    @Get('leaves/all')
    getAllLeaves(@Query() query: LeaveListQueryDto, @Request() req: any) {
        return this.hrService.getAllLeaves(query, {
            organizationId: req.user?.organizationId ?? null,
            role: req.user.role,
        });
    }

    @Roles(Role.VOLUNTEER)
    @Delete('leaves/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    cancelLeave(@Param('id') leaveId: string, @Request() req: any) {
        return this.hrService.cancelLeave(leaveId, req.user.id);
    }

    @Roles(
        Role.SUPER_ADMIN,
        Role.HR_MANAGER,
        Role.NGO_ADMIN,
        Role.FIELD_COORDINATOR,
    )
    @Put('leaves/:id/status')
    async updateLeaveStatus(@Param('id') leaveId: string, @Body() data: UpdateLeaveStatusDto, @Request() req: any) {
        const leave = await this.hrService.updateLeaveStatus(leaveId, data.status, {
            organizationId: req.user?.organizationId ?? null,
            role: req.user.role,
        });
        await this.auditService.log({
            actorId: req.user?.id,
            action: AuditAction.LEAVE_STATUS_UPDATED,
            entityType: 'Leave',
            entityId: leaveId,
            metadata: { status: data.status },
        });
        return leave;
    }

    // --- PAYROLL / PAYSLIPS ---
    @Roles(Role.VOLUNTEER)
    @Get('payslips/my-payslips')
    getMyPayslips(@Request() req: any) {
        return this.hrService.getMyPayslips(req.user.id);
    }

    @Roles(Role.SUPER_ADMIN, Role.HR_MANAGER, Role.NGO_ADMIN)
    @Get('payslips/all')
    getAllPayslips(@Query() query: PayslipListQueryDto) {
        return this.hrService.getAllPayslips(query);
    }

    @Roles(Role.SUPER_ADMIN, Role.HR_MANAGER)
    @Post('payslips/generate/:userId/:year/:month')
    generatePayslip(
        @Param('userId') userId: string,
        @Param('year', ParseIntPipe) year: number,
        @Param('month', ParseIntPipe) month: number,
        @Request() req: any,
    ) {
        return this.hrService.generatePayslipForUser(userId, month, year).then(async (payslip) => {
            await this.auditService.log({
                actorId: req.user?.id,
                action: AuditAction.PAYSLIP_GENERATED,
                entityType: 'Payslip',
                entityId: payslip.id,
                metadata: { userId, month, year },
            });
            return payslip;
        });
    }
}
