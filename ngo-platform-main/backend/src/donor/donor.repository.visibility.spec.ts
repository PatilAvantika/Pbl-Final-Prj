import { DonorRepository } from './donor.repository';
import { ReportStatus } from '@prisma/client';

describe('DonorRepository visibility (CampaignReport-only)', () => {
    const org = 'org-1';
    const donorId = 'donor-1';

    it('findDistinctLinkedReportIds returns unique report ids from funded campaigns only', async () => {
        const prisma = {
            donation: {
                findMany: jest.fn().mockResolvedValue([{ campaignId: 'c1' }]),
            },
            campaignReport: {
                findMany: jest
                    .fn()
                    .mockResolvedValue([
                        { reportId: 'r1' },
                        { reportId: 'r2' },
                        { reportId: 'r1' },
                    ]),
            },
        } as any;

        const repo = new DonorRepository(prisma);
        const campaignIds = await repo.findFundedCampaignIds(donorId, org);
        expect(campaignIds).toEqual(['c1']);
        const ids = await repo.findDistinctLinkedReportIds(['c1'], org);
        expect(ids.sort()).toEqual(['r1', 'r2']);
        expect(prisma.campaignReport.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    campaignId: { in: ['c1'] },
                    campaign: { organizationId: org },
                }),
            }),
        );
    });

    it('countDistinctLinkedApprovedReports scopes by organization', async () => {
        const prisma = {
            donation: { findMany: jest.fn().mockResolvedValue([{ campaignId: 'c1' }]) },
            campaignReport: {
                findMany: jest.fn().mockResolvedValue([{ reportId: 'r1' }]),
            },
            fieldReport: {
                count: jest.fn().mockResolvedValue(1),
            },
        } as any;

        const repo = new DonorRepository(prisma);
        await repo.countDistinctLinkedApprovedReports(['c1'], org);
        expect(prisma.fieldReport.count).toHaveBeenCalledWith({
            where: {
                id: { in: ['r1'] },
                status: ReportStatus.APPROVED,
                organizationId: org,
            },
        });
    });
});
