import { Controller, Post, Body, UseGuards, Request, Get, BadRequestException } from '@nestjs/common';
import { AttendanceService, ClockInDto } from './attendance.service';
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
        if (!data.lat || !data.lng || !data.taskId || !data.uniqueRequestId || !data.deviceId) {
            throw new BadRequestException('Missing required fields for geo-verified clock-in');
        }
        return this.attendanceService.clockIn(req.user.id, data);
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
