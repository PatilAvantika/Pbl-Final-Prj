import { useQuery } from '@tanstack/react-query';
import { getActiveTasks } from '../services/volunteer-api';

export const volunteerActiveTasksQueryKey = ['volunteer', 'active-tasks'] as const;

export function useActiveTasks() {
    return useQuery({
        queryKey: volunteerActiveTasksQueryKey,
        queryFn: getActiveTasks,
        staleTime: 30_000,
        refetchOnWindowFocus: true,
    });
}
