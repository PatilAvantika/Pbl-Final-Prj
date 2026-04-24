import { PrismaService } from '../prisma/prisma.service';
export declare class ReportSummaryService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    trySummarizeReport(reportId: string): Promise<void>;
}
