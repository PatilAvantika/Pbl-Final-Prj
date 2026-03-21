import { PrismaService } from '../prisma/prisma.service';
import { Prisma, FieldReport } from '@prisma/client';
import { TasksService } from '../tasks/tasks.service';
export declare class ReportsService {
    private prisma;
    private tasksService;
    constructor(prisma: PrismaService, tasksService: TasksService);
    create(userId: string, data: Prisma.FieldReportUncheckedCreateInput): Promise<FieldReport>;
    findAll(): Promise<FieldReport[]>;
    findOne(id: string): Promise<FieldReport>;
    findByTask(taskId: string): Promise<FieldReport[]>;
    findByUser(userId: string): Promise<FieldReport[]>;
}
