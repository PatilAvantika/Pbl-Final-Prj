import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { fetchWithTimeout } from './ai-http.util';

/**
 * Non-blocking report summarization via OpenAI-compatible API.
 * Failures are swallowed — core reporting always succeeds without AI.
 */
@Injectable()
export class ReportSummaryService {
  private readonly logger = new Logger(ReportSummaryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async trySummarizeReport(reportId: string): Promise<void> {
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
      if (!report) return;

      const userPrompt = [
        `Task: ${report.task.title} (${report.task.zoneName})`,
        `Quantity (items): ${report.quantityItems ?? 'n/a'}`,
        `Notes: ${report.notes ?? 'none'}`,
        'Write two short lines: (1) one-line summary (2) one-line impact statement for donors. Plain text only, no markdown.',
      ].join('\n');

      const res = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
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
              content:
                'You help NGOs document field work. Be factual and concise. Never invent quantities not in the notes.',
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
      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = data.choices?.[0]?.message?.content?.trim();
      if (!text) return;

      await this.prisma.fieldReport.update({
        where: { id: reportId },
        data: { aiSummary: text.slice(0, 2000) },
      });
      this.logger.log(`ai_summary stored reportId=${reportId}`);
    } catch (e) {
      this.logger.warn(`Report AI summary failed reportId=${reportId}: ${(e as Error).message}`);
    }
  }
}
