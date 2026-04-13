import {
    BadRequestException,
    Body,
    Controller,
    ForbiddenException,
    Get,
    Param,
    Post,
    Request,
    UseGuards,
} from '@nestjs/common';
import { IsIn, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { AttendanceService } from './attendance.service';
import { ClockInDto } from './dto/clock-in.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

class AttendanceOverrideDto {
    @IsUUID('4')
    attendanceId: string;

    @IsString()
    @IsNotEmpty()
    reason: string;

    @IsIn(['APPROVE', 'REJECT', 'CORRECT'])
    action: 'APPROVE' | 'REJECT' | 'CORRECT';
}

function requireOrganizationId(req: { user?: { organizationId?: string } }): string {
    const id = req.user?.organizationId;
    if (!id) throw new ForbiddenException('User is not associated with an organization');
    return id;
}

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
        const organizationId = requireOrganizationId(req);
        return this.attendanceService.clockIn(req.user.id, req.user.role, organizationId, data);
    }

    @Post('clock-out')
    async clockOut(@Request() req: any, @Body() data: ClockInDto) {
        if (data.lat === undefined || data.lat === null) {
            throw new BadRequestException('Missing latitude for geo-verified clock-out');
        }
        if (data.lng === undefined || data.lng === null) {
            throw new BadRequestException('Missing longitude for geo-verified clock-out');
        }
        const organizationId = requireOrganizationId(req);
        return this.attendanceService.clockOut(req.user.id, req.user.role, organizationId, data);
    }

    @Get('my-history')
    getMyAttendances(@Request() req: any) {
        return this.attendanceService.getMyAttendances(req.user.id);
    }

    @Roles(
        Role.TEAM_LEADER,
        Role.SUPER_ADMIN,
        Role.NGO_ADMIN,
        Role.FIELD_COORDINATOR,
        Role.HR_MANAGER,
    )
    @Get('task/:taskId')
    listAttendanceForTask(@Param('taskId') taskId: string, @Request() req: any) {
        const organizationId = requireOrganizationId(req);
        return this.attendanceService.listAttendanceForTask(
            taskId,
            organizationId,
            req.user.id,
            req.user.role,
        );
    }

    @Roles(
        Role.TEAM_LEADER,
        Role.SUPER_ADMIN,
        Role.NGO_ADMIN,
        Role.FIELD_COORDINATOR,
        Role.HR_MANAGER,
    )
    @Get('team-live')
    teamLive() {
        return this.attendanceService.listTeamLive();
    }

    @Roles(Role.TEAM_LEADER, Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.FIELD_COORDINATOR)
    @Post('override')
    override(@Request() req: any, @Body() body: AttendanceOverrideDto) {
        return this.attendanceService.recordAttendanceOverride(req.user.id, body);
    }

    @Roles(Role.SUPER_ADMIN, Role.HR_MANAGER, Role.NGO_ADMIN)
    @Get('all')
    getAll() {
        return this.attendanceService.getAllAttendances();
    }
}
