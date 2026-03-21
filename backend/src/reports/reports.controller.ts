import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { Prisma, Role } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

export class CreateReportDto {
    taskId: string;
    beforePhotoUrl?: string;
    afterPhotoUrl?: string;
    quantityItems?: number;
    notes?: string;
}

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Post()
    create(@Request() req: any, @Body() data: CreateReportDto) {
        return this.reportsService.create(req.user.id, data as Prisma.FieldReportUncheckedCreateInput);
    }

    @Roles(Role.SUPER_ADMIN, Role.NGO_ADMIN, Role.FIELD_COORDINATOR)
    @Get()
    findAll() {
        return this.reportsService.findAll();
    }

    @Get('my-reports')
    findMyReports(@Request() req: any) {
        return this.reportsService.findByUser(req.user.id);
    }

    @Get('task/:taskId')
    findByTask(@Param('taskId') taskId: string) {
        return this.reportsService.findByTask(taskId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.reportsService.findOne(id);
    }
}
