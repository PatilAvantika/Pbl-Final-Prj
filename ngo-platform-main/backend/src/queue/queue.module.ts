import { Global, Module } from '@nestjs/common';
import { ReportQueueService } from './report-queue.service';

@Global()
@Module({
    providers: [ReportQueueService],
    exports: [ReportQueueService],
})
export class QueueModule {}
