import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '../services/volunteer-api';

export const volunteerDashboardQueryKey = ['volunteer-dashboard'] as const;

export function useDashboardStats() {
    return useQuery({
        queryKey: volunteerDashboardQueryKey,
        queryFn: getDashboardStats,
        refetchInterval: 60_000,
        refetchOnWindowFocus: true,
    });
}
