import { BadRequestException, Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { ClockInDto } from './dto/clock-in.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('attendance')
export class AttendanceController {
    constructor(private readonly attendanceService: AttendanceService) { }

    @Post('clock-in')
    async clockIn(@Request() req: any, @Body() data: ClockInDto) {
        if (data.lat === undefined || data.lat === null) {
            throw new BadRequestException('Missing latitude for geo-verified clock-in');
        }
        if (data.lng === undefined || data.lng === null) {
            throw new BadRequestException('Missing longitude for geo-verified clock-in');
        }
        return this.attendanceService.clockIn(req.user.id, req.user.role, data);
    }

    @Post('clock-out')
    async clockOut(@Request() req: any, @Body() data: ClockInDto) {
        if (data.lat === undefined || data.lat === null) {
            throw new BadRequestException('Missing latitude for geo-verified clock-out');
        }
        if (data.lng === undefined || data.lng === null) {
            throw new BadRequestException('Missing longitude for geo-verified clock-out');
        }
        return this.attendanceService.clockOut(req.user.id, req.user.role, data);
    }

    @Get('my-history')
    getMyAttendances(@Request() req: any) {
        return this.attendanceService.getMyAttendances(req.user.id);
    }

    @Roles(Role.SUPER_ADMIN, Role.HR_MANAGER, Role.NGO_ADMIN)
    @Get('all')
    getAll() {
        return this.attendanceService.getAllAttendances();
    }
}
