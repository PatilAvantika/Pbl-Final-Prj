import { useQuery } from '@tanstack/react-query';
import { getAttendanceSummary } from '../services/volunteer-api';

export const attendanceSummaryQueryKey = ['attendance-summary'] as const;

export const useAttendanceSummary = () => {
    return useQuery({
        queryKey: attendanceSummaryQueryKey,
        queryFn: getAttendanceSummary,
        staleTime: 30_000,
    });
};
