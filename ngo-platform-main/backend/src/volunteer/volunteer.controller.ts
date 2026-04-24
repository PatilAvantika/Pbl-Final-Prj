import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { VolunteerService } from './volunteer.service';
import { VolunteerCreateLeaveDto } from './dto/volunteer-create-leave.dto';

function requireOrganizationId(req: { user?: { organizationId?: string } }): string {
  const id = req.user?.organizationId;
  if (!id) throw new ForbiddenException('User is not associated with an organization');
  return id;
}

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('volunteer')
export class VolunteerController {
  constructor(private readonly volunteerService: VolunteerService) {}

  @Roles(Role.VOLUNTEER)
  @Get('dashboard')
  getDashboard(@Request() req: { user: { id: string; organizationId?: string } }) {
    const organizationId = requireOrganizationId(req);
    return this.volunteerService.getDashboardStats(req.user.id, organizationId);
  }

  @Roles(Role.VOLUNTEER)
  @Get('profile')
  getProfile(@Request() req: { user: { id: string } }) {
    return this.volunteerService.getProfile(req.user.id);
  }

  @Roles(Role.VOLUNTEER)
  @Get('leave-summary')
  getLeaveSummary(@Request() req: { user: { id: string } }) {
    return this.volunteerService.getLeaveSummary(req.user.id);
  }

  @Roles(Role.VOLUNTEER)
  @Get('leaves')
  getLeaves(@Request() req: { user: { id: string } }) {
    return this.volunteerService.getLeaves(req.user.id);
  }

  @Roles(Role.VOLUNTEER)
  @Post('leaves')
  createLeave(@Request() req: { user: { id: string } }, @Body() body: VolunteerCreateLeaveDto) {
    return this.volunteerService.createLeave(req.user.id, {
      type: body.type,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      reason: body.reason,
    });
  }

  @Roles(Role.VOLUNTEER)
  @Delete('leaves/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  cancelLeave(@Param('id') leaveId: string, @Request() req: { user: { id: string } }) {
    return this.volunteerService.cancelLeave(leaveId, req.user.id);
  }
}
