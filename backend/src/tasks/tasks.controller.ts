import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, Request, Query } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { AuditAction, Prisma, TaskTemplate, Role } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { IsBooleanString, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { AuditService } from '../audit/audit.service';

export class CreateTaskDto {
    title: string;
    description?: string;
    template: TaskTemplate;
    zoneName: string;
    geofenceLat: number;
    geofenceLng: number;
    geofenceRadius: number;
    startTime: string | Date;
    endTime: string | Date;
    isActive?: boolean;
}

export class AssignUserDto {
    userId: string;
}

export class TasksQueryDto extends PaginationQueryDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsEnum(TaskTemplate)
    template?: TaskTemplate;

    @IsOptional()
    @IsBooleanString()
    isActive?: string;
}

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('tasks')
export class TasksController {
    constructor(
        private readonly tasksService: TasksService,
        private readonly auditService: AuditService,
    ) { }

    @Roles(Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.FIELD_COORDINATOR)
    @Post()
    async create(@Body() data: CreateTaskDto, @Request() req: any) {
        const parsedData: Prisma.TaskCreateInput = {
            ...data,
            startTime: new Date(data.startTime),
            endTime: new Date(data.endTime)
        };
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
    @Roles(Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.FIELD_COORDINATOR, Role.HR_MANAGER, Role.FINANCE_MANAGER)
    findAll(@Query() query: TasksQueryDto) {
        return this.tasksService.findAll({
            page: query.page,
            limit: query.limit,
            search: query.search,
            template: query.template,
            isActive: query.isActive !== undefined ? query.isActive === 'true' : undefined,
        });
    }

    @Get('my-tasks')
    findMyTasks(@Request() req: any) {
        return this.tasksService.findAssignedToUser(req.user.id);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req: any) {
        return this.tasksService.findOneForRequester(id, req.user.id, req.user.role);
    }

    @Roles(Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.FIELD_COORDINATOR)
    @Put(':id')
    async update(@Param('id') id: string, @Body() updateTaskDto: Partial<CreateTaskDto>, @Request() req: any) {
        const task = await this.tasksService.update(id, updateTaskDto as unknown as Prisma.TaskUpdateInput);
        await this.auditService.log({
            actorId: req.user?.id,
            action: AuditAction.TASK_UPDATED,
            entityType: 'Task',
            entityId: id,
            metadata: { changedFields: Object.keys(updateTaskDto || {}) },
        });
        return task;
    }

    @Roles(Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.FIELD_COORDINATOR)
    @Delete(':id')
    async remove(@Param('id') id: string, @Request() req: any) {
        const task = await this.tasksService.remove(id);
        await this.auditService.log({
            actorId: req.user?.id,
            action: AuditAction.TASK_DELETED,
            entityType: 'Task',
            entityId: id,
            metadata: { title: task.title },
        });
        return task;
    }

    // --- Assignments ---
    @Roles(Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.FIELD_COORDINATOR)
    @Post(':id/assign')
    async assignUser(@Param('id') taskId: string, @Body() data: AssignUserDto, @Request() req: any) {
        const assignment = await this.tasksService.assignUserToTask(taskId, data.userId);
        await this.auditService.log({
            actorId: req.user?.id,
            action: AuditAction.TASK_ASSIGNED,
            entityType: 'TaskAssignment',
            entityId: assignment.id,
            metadata: { taskId, userId: data.userId },
        });
        return assignment;
    }

    @Roles(Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.FIELD_COORDINATOR)
    @Delete(':id/assign/:userId')
    async removeUser(@Param('id') taskId: string, @Param('userId') userId: string, @Request() req: any) {
        await this.tasksService.removeUserFromTask(taskId, userId);
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
