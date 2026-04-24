import { useQuery } from '@tanstack/react-query';
import { getMapData } from '../services/admin-api';

export const mapDataQueryKey = ['map-data'] as const;

export const useMapData = () => {
    return useQuery({
        queryKey: mapDataQueryKey,
        queryFn: getMapData,
        refetchInterval: 10_000,
        refetchOnWindowFocus: true,
    });
};
