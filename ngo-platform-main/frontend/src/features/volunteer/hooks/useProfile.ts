import { useQuery } from '@tanstack/react-query';
import { getProfile } from '../services/volunteer-api';

export const volunteerProfileQueryKey = ['volunteer', 'profile'] as const;

export const useProfile = () => {
    return useQuery({
        queryKey: volunteerProfileQueryKey,
        queryFn: getProfile,
        staleTime: 60_000,
    });
};
