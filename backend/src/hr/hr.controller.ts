import { Controller, Get, Post, Body, Param, Put, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { HrService } from './hr.service';
import { LeaveStatus, LeaveType } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

export class RequestLeaveDto {
    type: LeaveType;
    startDate: string | Date;
    endDate: string | Date;
    reason: string;
}

export class UpdateLeaveStatusDto {
    status: LeaveStatus;
}

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('hr')
export class HrController {
    constructor(private readonly hrService: HrService) { }

    // --- LEAVES ---
    @Post('leaves')
    requestLeave(@Request() req: any, @Body() data: RequestLeaveDto) {
        return this.hrService.requestLeave(req.user.id, {
            type: data.type,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
            reason: data.reason
        } as any);
    }

    @Get('leaves/my-leaves')
    getMyLeaves(@Request() req: any) {
        return this.hrService.getMyLeaves(req.user.id);
    }

    @Roles(Role.SUPER_ADMIN, Role.HR_MANAGER, Role.NGO_ADMIN)
    @Get('leaves/all')
    getAllLeaves() {
        return this.hrService.getAllLeaves();
    }

    @Roles(Role.SUPER_ADMIN, Role.HR_MANAGER, Role.NGO_ADMIN)
    @Put('leaves/:id/status')
    updateLeaveStatus(@Param('id') leaveId: string, @Body() data: UpdateLeaveStatusDto) {
        return this.hrService.updateLeaveStatus(leaveId, data.status);
    }

    // --- PAYROLL / PAYSLIPS ---
    @Get('payslips/my-payslips')
    getMyPayslips(@Request() req: any) {
        return this.hrService.getMyPayslips(req.user.id);
    }

    @Roles(Role.SUPER_ADMIN, Role.HR_MANAGER, Role.NGO_ADMIN)
    @Get('payslips/all')
    getAllPayslips() {
        return this.hrService.getAllPayslips();
    }

    @Roles(Role.SUPER_ADMIN, Role.HR_MANAGER)
    @Post('payslips/generate/:userId/:year/:month')
    generatePayslip(
        @Param('userId') userId: string,
        @Param('year', ParseIntPipe) year: number,
        @Param('month', ParseIntPipe) month: number
    ) {
        return this.hrService.generatePayslipForUser(userId, month, year);
    }
}
