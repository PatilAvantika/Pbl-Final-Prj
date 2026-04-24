import { OnModuleDestroy } from '@nestjs/common';
export declare class ReportQueueService implements OnModuleDestroy {
    private readonly log;
    private queue;
    constructor();
    enqueueReportProcessing(reportId: string): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
