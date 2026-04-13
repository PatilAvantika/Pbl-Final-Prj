import { useQuery } from '@tanstack/react-query';
import { getLeaveSummary } from '../services/volunteer-api';

export const volunteerLeaveSummaryQueryKey = ['volunteer', 'leave-summary'] as const;

export const useLeaveSummary = () => {
    return useQuery({
        queryKey: volunteerLeaveSummaryQueryKey,
        queryFn: getLeaveSummary,
        staleTime: 30_000,
    });
};
