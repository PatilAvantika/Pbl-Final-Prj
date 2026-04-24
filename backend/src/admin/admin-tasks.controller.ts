import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AdminTasksService } from './admin-tasks.service';
import { AdminTasksQueryDto } from './dto/admin-tasks-query.dto';
import { AdminPatchTaskDto } from './dto/admin-patch-task.dto';

function requireOrganizationId(req: { user?: { organizationId?: string } }): string {
  const id = req.user?.organizationId;
  if (!id) throw new ForbiddenException('User is not associated with an organization');
  return id;
}

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('admin/tasks')
export class AdminTasksController {
  constructor(private readonly adminTasks: AdminTasksService) {}

  @Roles(Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.FIELD_COORDINATOR, Role.HR_MANAGER, Role.FINANCE_MANAGER)
  @Get()
  list(@Query() query: AdminTasksQueryDto, @Request() req: { user?: { organizationId?: string } }) {
    const organizationId = requireOrganizationId(req);
    return this.adminTasks.list(organizationId, query);
  }

  @Roles(Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.FIELD_COORDINATOR, Role.HR_MANAGER, Role.FINANCE_MANAGER)
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: { user?: { organizationId?: string } }) {
    const organizationId = requireOrganizationId(req);
    return this.adminTasks.findOne(organizationId, id);
  }

  @Roles(Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.FIELD_COORDINATOR, Role.HR_MANAGER, Role.FINANCE_MANAGER)
  @Patch(':id')
  patch(
    @Param('id') id: string,
    @Body() body: AdminPatchTaskDto,
    @Request() req: { user?: { id?: string; organizationId?: string } },
  ) {
    const organizationId = requireOrganizationId(req);
    return this.adminTasks.patch(organizationId, id, body, req.user?.id);
  }

  @Roles(Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.FIELD_COORDINATOR, Role.HR_MANAGER, Role.FINANCE_MANAGER)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: { user?: { id?: string; organizationId?: string } }) {
    const organizationId = requireOrganizationId(req);
    return this.adminTasks.softDelete(organizationId, id, req.user?.id);
  }
}
