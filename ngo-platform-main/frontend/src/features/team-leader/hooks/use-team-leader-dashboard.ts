import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api/client';

export const teamLeaderDashboardKeys = {
    all: ['team-leader', 'dashboard'] as const,
};

export interface TeamLeaderDashboardStats {
    totalTasks: number;
    activeTasks: number;
    totalVolunteers: number;
    attendanceToday: number;
    reportsSubmitted: number;
    reportsPending: number;
    reportsApproved: number;
    reportsRejected: number;
}

export function useTeamLeaderDashboard() {
    return useQuery({
        queryKey: teamLeaderDashboardKeys.all,
        queryFn: async () => {
            const { data } = await api.get<TeamLeaderDashboardStats>('/team-leader/dashboard');
            return data;
        },
    });
}
