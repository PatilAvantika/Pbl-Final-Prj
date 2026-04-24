import {
    Controller,
    ForbiddenException,
    Get,
    Post,
    Body,
    Param,
    Delete,
    Put,
    Patch,
    UseGuards,
    Request,
    Query,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { AuditAction, Prisma, Role } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AuditService } from '../audit/audit.service';
import { AssignStrategyDto, PatchTaskDto } from './dto/patch-task.dto';
import { AssignUserDto, CreateTaskDto, TasksQueryDto, UpdateTaskDto } from './dto/task-mutations.dto';

function requireOrganizationId(req: { user?: { organizationId?: string } }): string {
    const id = req.user?.organizationId;
    if (!id) throw new ForbiddenException('User is not associated with an organization');
    return id;
}

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('tasks')
export class TasksController {
    constructor(
        private readonly tasksService: TasksService,
        private readonly auditService: AuditService,
    ) {}

    @Roles(Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.FIELD_COORDINATOR, Role.TEAM_LEADER)
    @Post()
    async create(@Body() data: CreateTaskDto, @Request() req: any) {
        const organizationId = requireOrganizationId(req);
        const { priority, maxVolunteers, ...rest } = data;
        const parsedData: Prisma.TaskCreateInput = {
            ...rest,
            startTime: new Date(data.startTime),
            endTime: new Date(data.endTime),
            priority: priority ?? 'MEDIUM',
            maxVolunteers: maxVolunteers ?? undefined,
            organization: { connect: { id: organizationId } },
        };
        if (req.user?.role === Role.TEAM_LEADER && req.user?.id) {
            parsedData.teamLeader = { connect: { id: req.user.id } };
        }
        const task = await this.tasksService.create(parsedData);
        await this.auditService.log({
            actorId: req.user?.id,
            action: AuditAction.TASK_CREATED,
            entityType: 'Task',
            entityId: task.id,
            metadata: { title: task.title },
        });
        return task;
    }

    @Get()
    @Roles(
        Role.SUPER_ADMIN,
        Role.NGO_ADMIN,
        Role.FIELD_COORDINATOR,
        Role.HR_MANAGER,
        Role.FINANCE_MANAGER,
        Role.TEAM_LEADER,
    )
    findAll(@Query() query: TasksQueryDto, @Request() req: any) {
        const organizationId = requireOrganizationId(req);
        return this.tasksService.findAll({
            page: query.page,
            limit: query.limit,
            search: query.search,
            template: query.template,
            isActive: query.isActive !== undefined ? query.isActive === 'true' : undefined,
            organizationId,
        });
    }

    @Get('my-tasks')
    findMyTasks(@Request() req: any) {
        const organizationId = requireOrganizationId(req);
        return this.tasksService.findAssignedToUser(req.user.id, organizationId);
    }

    @Roles(Role.TEAM_LEADER)
    @Get('team-leader')
    findTeamLeaderTasks(@Request() req: any) {
        const organizationId = requireOrganizationId(req);
        return this.tasksService.findTasksForTeamLeader(req.user.id, organizationId);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req: any) {
        const organizationId = requireOrganizationId(req);
        return this.tasksService.findOneForRequester(id, req.user.id, req.user.role, organizationId);
    }

    @Roles(Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.FIELD_COORDINATOR, Role.TEAM_LEADER)
    @Put(':id')
    async update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto, @Request() req: any) {
        const organizationId = requireOrganizationId(req);
        const task = await this.tasksService.update(
            id,
            organizationId,
            updateTaskDto as unknown as Prisma.TaskUpdateInput,
        );
        await this.auditService.log({
            actorId: req.user?.id,
            action: AuditAction.TASK_UPDATED,
            entityType: 'Task',
            entityId: id,
            metadata: { changedFields: Object.keys(updateTaskDto || {}) },
        });
        return task;
    }

    /** Team-leader / field-ops partial update (lifecycle, assigneeIds, task fields). */
    @Roles(Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.FIELD_COORDINATOR, Role.TEAM_LEADER)
    @Patch(':id')
    async patch(@Param('id') id: string, @Body() dto: PatchTaskDto, @Request() req: any) {
        const organizationId = requireOrganizationId(req);
        return this.tasksService.patchTeamLeader(
            id,
            organizationId,
            req.user.id,
            req.user.role,
            dto,
        );
    }

    /** Explicit assignment strategy (legacy Express parity). */
    @Roles(Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.FIELD_COORDINATOR, Role.TEAM_LEADER)
    @Post(':id/assign-strategy')
    async assignStrategy(
        @Param('id') taskId: string,
        @Body() body: AssignStrategyDto,
        @Request() req: any,
    ) {
        const organizationId = requireOrganizationId(req);
        return this.tasksService.assignWithStrategy(
            taskId,
            organizationId,
            req.user.id,
            req.user.role,
            body.mode,
            body.userIds,
        );
    }

    @Roles(Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.FIELD_COORDINATOR, Role.TEAM_LEADER)
    @Delete(':id')
    async remove(@Param('id') id: string, @Request() req: any) {
        const organizationId = requireOrganizationId(req);
        const task = await this.tasksService.remove(id, organizationId);
        await this.auditService.log({
            actorId: req.user?.id,
            action: AuditAction.TASK_DELETED,
            entityType: 'Task',
            entityId: id,
            metadata: { title: task.title },
        });
        return task;
    }

    @Roles(Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.FIELD_COORDINATOR, Role.TEAM_LEADER)
    @Post(':id/assign')
    async assignUser(@Param('id') taskId: string, @Body() data: AssignUserDto, @Request() req: any) {
        const organizationId = requireOrganizationId(req);
        const assignment = await this.tasksService.assignUserToTask(taskId, data.userId, organizationId, {
            id: req.user.id,
            role: req.user.role,
        });
        await this.auditService.log({
            actorId: req.user?.id,
            action: AuditAction.TASK_ASSIGNED,
            entityType: 'TaskAssignment',
            entityId: assignment.id,
            metadata: { taskId, userId: data.userId },
        });
        return assignment;
    }

    @Roles(Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.FIELD_COORDINATOR, Role.TEAM_LEADER)
    @Delete(':id/assign/:userId')
    async removeUser(@Param('id') taskId: string, @Param('userId') userId: string, @Request() req: any) {
        const organizationId = requireOrganizationId(req);
        await this.tasksService.removeUserFromTask(taskId, userId, organizationId, {
            id: req.user.id,
            role: req.user.role,
        });
        await this.auditService.log({
            actorId: req.user?.id,
            action: AuditAction.TASK_UNASSIGNED,
            entityType: 'TaskAssignment',
            entityId: `${taskId}:${userId}`,
            metadata: { taskId, userId },
        });
        return { success: true };
    }
}
