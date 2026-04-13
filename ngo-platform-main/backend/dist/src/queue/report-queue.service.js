"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ReportQueueService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportQueueService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("bullmq");
let ReportQueueService = ReportQueueService_1 = class ReportQueueService {
    log = new common_1.Logger(ReportQueueService_1.name);
    queue = null;
    constructor() {
        const enabled = process.env.BULLMQ_ENABLED === 'true';
        const url = process.env.REDIS_URL?.trim();
        if (!enabled || !url) {
            this.log.log('Report queue disabled (BULLMQ_ENABLED=true + REDIS_URL to enable)');
            return;
        }
        try {
            this.queue = new bullmq_1.Queue('report-processing', {
                connection: { url, maxRetriesPerRequest: null },
            });
        }
        catch (e) {
            this.log.warn(`Report queue init failed: ${e instanceof Error ? e.message : e}`);
        }
    }
    async enqueueReportProcessing(reportId) {
        if (!this.queue) {
            this.log.debug(`report_processing_inline reportId=${reportId}`);
            return;
        }
        try {
            await this.queue.add('process', { reportId }, {
                removeOnComplete: true,
                attempts: 3,
                backoff: { type: 'exponential', delay: 2000 },
            });
        }
        catch (e) {
            this.log.warn(`enqueue failed ${reportId}: ${e instanceof Error ? e.message : e}`);
        }
    }
    async onModuleDestroy() {
        await this.queue?.close().catch(() => undefined);
        this.queue = null;
    }
};
exports.ReportQueueService = ReportQueueService;
exports.ReportQueueService = ReportQueueService = ReportQueueService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], ReportQueueService);
//# sourceMappingURL=report-queue.service.js.map