import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';

/**
 * Optional BullMQ queue for async report processing (legacy Express parity).
 * Enable with BULLMQ_ENABLED=true and REDIS_URL.
 */
@Injectable()
export class ReportQueueService implements OnModuleDestroy {
    private readonly log = new Logger(ReportQueueService.name);
    private queue: Queue | null = null;

    constructor() {
        const enabled = process.env.BULLMQ_ENABLED === 'true';
        const url = process.env.REDIS_URL?.trim();
        if (!enabled || !url) {
            this.log.log('Report queue disabled (BULLMQ_ENABLED=true + REDIS_URL to enable)');
            return;
        }
        try {
            this.queue = new Queue('report-processing', {
                connection: { url, maxRetriesPerRequest: null } as Record<string, unknown>,
            });
        } catch (e) {
            this.log.warn(`Report queue init failed: ${e instanceof Error ? e.message : e}`);
        }
    }

    async enqueueReportProcessing(reportId: string): Promise<void> {
        if (!this.queue) {
            this.log.debug(`report_processing_inline reportId=${reportId}`);
            return;
        }
        try {
            await this.queue.add(
                'process',
                { reportId },
                {
                    removeOnComplete: true,
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 2000 },
                },
            );
        } catch (e) {
            this.log.warn(`enqueue failed ${reportId}: ${e instanceof Error ? e.message : e}`);
        }
    }

    async onModuleDestroy(): Promise<void> {
        await this.queue?.close().catch(() => undefined);
        this.queue = null;
    }
}
