import { ReportsService } from './reports.service';
export declare class CreateReportDto {
    taskId: string;
    beforePhotoUrl?: string;
    afterPhotoUrl?: string;
    quantityItems?: number;
    notes?: string;
}
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    create(req: any, data: CreateReportDto): Promise<{
        id: string;
        timestamp: Date;
        taskId: string;
        userId: string;
        beforePhotoUrl: string | null;
        afterPhotoUrl: string | null;
        quantityItems: number | null;
        notes: string | null;
    }>;
    findAll(): Promise<{
        id: string;
        timestamp: Date;
        taskId: string;
        userId: string;
        beforePhotoUrl: string | null;
        afterPhotoUrl: string | null;
        quantityItems: number | null;
        notes: string | null;
    }[]>;
    findMyReports(req: any): Promise<{
        id: string;
        timestamp: Date;
        taskId: string;
        userId: string;
        beforePhotoUrl: string | null;
        afterPhotoUrl: string | null;
        quantityItems: number | null;
        notes: string | null;
    }[]>;
    findByTask(taskId: string): Promise<{
        id: string;
        timestamp: Date;
        taskId: string;
        userId: string;
        beforePhotoUrl: string | null;
        afterPhotoUrl: string | null;
        quantityItems: number | null;
        notes: string | null;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        timestamp: Date;
        taskId: string;
        userId: string;
        beforePhotoUrl: string | null;
        afterPhotoUrl: string | null;
        quantityItems: number | null;
        notes: string | null;
    }>;
}
