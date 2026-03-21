import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, Request } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Prisma, TaskTemplate, Role } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

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

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('tasks')
export class TasksController {
    constructor(private readonly tasksService: TasksService) { }

    @Roles(Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.FIELD_COORDINATOR)
    @Post()
    create(@Body() data: CreateTaskDto) {
        const parsedData: Prisma.TaskCreateInput = {
            ...data,
            startTime: new Date(data.startTime),
            endTime: new Date(data.endTime)
        };
        return this.tasksService.create(parsedData);
    }

    @Get()
    findAll() {
        return this.tasksService.findAll();
    }

    @Get('my-tasks')
    findMyTasks(@Request() req: any) {
        return this.tasksService.findAssignedToUser(req.user.id);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.tasksService.findOne(id);
    }

    @Roles(Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.FIELD_COORDINATOR)
    @Put(':id')
    update(@Param('id') id: string, @Body() updateTaskDto: Partial<CreateTaskDto>) {
        return this.tasksService.update(id, updateTaskDto as unknown as Prisma.TaskUpdateInput);
    }

    @Roles(Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.FIELD_COORDINATOR)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.tasksService.remove(id);
    }

    // --- Assignments ---
    @Roles(Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.FIELD_COORDINATOR)
    @Post(':id/assign')
    assignUser(@Param('id') taskId: string, @Body() data: AssignUserDto) {
        return this.tasksService.assignUserToTask(taskId, data.userId);
    }

    @Roles(Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.FIELD_COORDINATOR)
    @Delete(':id/assign/:userId')
    removeUser(@Param('id') taskId: string, @Param('userId') userId: string) {
        return this.tasksService.removeUserFromTask(taskId, userId);
    }
}
