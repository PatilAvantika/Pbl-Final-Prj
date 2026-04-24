import { useQuery } from '@tanstack/react-query';
import { getLeaves } from '../services/volunteer-api';

export const volunteerLeavesQueryKey = ['volunteer', 'leaves'] as const;

export const useLeaves = () => {
    return useQuery({
        queryKey: volunteerLeavesQueryKey,
        queryFn: getLeaves,
        staleTime: 20_000,
    });
};
