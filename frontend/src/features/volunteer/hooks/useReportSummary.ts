import { useQuery } from '@tanstack/react-query';
import { getReportSummary } from '../services/volunteer-api';

export const reportSummaryQueryKey = ['report-summary'] as const;

export const useReportSummary = () => {
    return useQuery({
        queryKey: reportSummaryQueryKey,
        queryFn: getReportSummary,
        staleTime: 45_000,
    });
};
