import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '../services/admin-api';

export const adminDashboardQueryKey = ['admin-dashboard'] as const;

export const useAdminDashboard = () => {
    return useQuery({
        queryKey: adminDashboardQueryKey,
        queryFn: getDashboardStats,
        refetchInterval: 30_000,
        refetchOnWindowFocus: true,
    });
};
