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
var ReportSummaryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportSummaryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const ai_http_util_1 = require("./ai-http.util");
let ReportSummaryService = ReportSummaryService_1 = class ReportSummaryService {
    prisma;
    logger = new common_1.Logger(ReportSummaryService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async trySummarizeReport(reportId) {
        const key = process.env.OPENAI_API_KEY;
        if (!key) {
            this.logger.debug('OPENAI_API_KEY unset — skip report AI summary');
            return;
        }
        try {
            const report = await this.prisma.fieldReport.findUnique({
                where: { id: reportId },
                include: { task: { select: { title: true, zoneName: true } } },
            });
            if (!report)
                return;
            const userPrompt = [
                `Task: ${report.task.title} (${report.task.zoneName})`,
                `Quantity (items): ${report.quantityItems ?? 'n/a'}`,
                `Notes: ${report.notes ?? 'none'}`,
                'Write two short lines: (1) one-line summary (2) one-line impact statement for donors. Plain text only, no markdown.',
            ].join('\n');
            const res = await (0, ai_http_util_1.fetchWithTimeout)('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                timeoutMs: 20_000,
                headers: {
                    Authorization: `Bearer ${key}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: 'You help NGOs document field work. Be factual and concise. Never invent quantities not in the notes.',
                        },
                        { role: 'user', content: userPrompt },
                    ],
                    max_tokens: 200,
                    temperature: 0.3,
                }),
            });
            if (!res.ok) {
                this.logger.warn(`OpenAI report summary HTTP ${res.status}`);
                return;
            }
            const data = (await res.json());
            const text = data.choices?.[0]?.message?.content?.trim();
            if (!text)
                return;
            await this.prisma.fieldReport.update({
                where: { id: reportId },
                data: { aiSummary: text.slice(0, 2000) },
            });
            this.logger.log(`ai_summary stored reportId=${reportId}`);
        }
        catch (e) {
            this.logger.warn(`Report AI summary failed reportId=${reportId}: ${e.message}`);
        }
    }
};
exports.ReportSummaryService = ReportSummaryService;
exports.ReportSummaryService = ReportSummaryService = ReportSummaryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportSummaryService);
//# sourceMappingURL=report-summary.service.js.map