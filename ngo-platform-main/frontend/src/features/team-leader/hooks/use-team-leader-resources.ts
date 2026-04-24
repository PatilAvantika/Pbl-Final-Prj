import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { getApiErrorMessage } from '@/lib/api-errors';
import { toast } from 'sonner';

export const teamLeaderResourceKeys = {
    inventory: ['team-leader', 'resources', 'inventory'] as const,
    allocations: ['team-leader', 'resources', 'allocations'] as const,
};

export type OrgResourceRow = {
    id: string;
    name: string;
    quantity: number;
    organizationId?: string;
};

export type ResourceAllocationRow = {
    id: string;
    resourceId: string;
    taskId: string;
    quantity: number;
    resource?: { id: string; name: string; quantity?: number };
    task?: { id: string; title: string };
};

function unwrapArray<T>(data: unknown): T[] {
    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data: unknown }).data)) {
        return (data as { data: T[] }).data;
    }
    return [];
}

export function useOrgResources() {
    return useQuery({
        queryKey: teamLeaderResourceKeys.inventory,
        queryFn: async () => {
            const { data } = await api.get<unknown>('/resources');
            return unwrapArray<OrgResourceRow>(data);
        },
    });
}

export function useResourceAllocations() {
    return useQuery({
        queryKey: teamLeaderResourceKeys.allocations,
        queryFn: async () => {
            const { data } = await api.get<unknown>('/resources/allocations');
            return unwrapArray<ResourceAllocationRow>(data);
        },
    });
}

export function useAllocateResource() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (body: { resourceId: string; taskId: string; quantity: number }) => {
            const { data } = await api.post<unknown>('/resources/allocate', body);
            return data;
        },
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: teamLeaderResourceKeys.inventory });
            void qc.invalidateQueries({ queryKey: teamLeaderResourceKeys.allocations });
            void qc.invalidateQueries({ queryKey: ['team-leader', 'dashboard'] });
            toast.success('Resources allocated');
        },
        onError: (e) => toast.error(getApiErrorMessage(e, 'Allocation failed')),
    });
}

export function useCreateOrgResource() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (body: { name: string; quantity?: number }) => {
            const { data } = await api.post<OrgResourceRow>('/resources', body);
            return data;
        },
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: teamLeaderResourceKeys.inventory });
            toast.success('Resource added');
        },
        onError: (e) => toast.error(getApiErrorMessage(e, 'Could not create resource')),
    });
}
