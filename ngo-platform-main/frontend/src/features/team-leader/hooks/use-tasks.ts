import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { getApiErrorMessage } from '@/lib/api-errors';
import { unwrapList } from '@/features/team-leader/lib/unwrap';
import type { Task, TaskStatus } from '@/features/team-leader/types/team-leader';
import { toast } from 'sonner';

export const taskKeys = {
    all: ['tasks', 'team-leader'] as const,
};

type ApiTeamLeaderTask = {
    id: string;
    title: string;
    description?: string | null;
    lifecycleStatus: string;
    endTime: string;
    geofenceLat: number;
    geofenceLng: number;
    assignments?: { userId: string; user?: { role?: string } }[];
    _count?: { attendances: number; reports: number };
};

export function mapApiTaskToUi(t: ApiTeamLeaderTask): Task {
    const ls = t.lifecycleStatus;
    const status: TaskStatus =
        ls === 'COMPLETED' ? 'COMPLETED' : ls === 'ACTIVE' ? 'IN_PROGRESS' : 'PENDING';
    const assigneeIds =
        t.assignments?.filter((a) => a.user?.role === 'VOLUNTEER').map((a) => a.userId) ?? [];
    return {
        id: t.id,
        title: t.title,
        description: t.description ?? undefined,
        status,
        deadline: t.endTime,
        latitude: t.geofenceLat,
        longitude: t.geofenceLng,
        open: true,
        assigneeIds,
        attendanceCount: t._count?.attendances,
        reportCount: t._count?.reports,
    };
}

export interface CreateTaskInput {
    title: string;
    description?: string;
    latitude?: number;
    longitude?: number;
    locationLabel?: string;
    deadline?: string;
    requiredResources?: string[];
    open?: boolean;
    assigneeIds?: string[];
}

export function useTasks() {
    return useQuery({
        queryKey: taskKeys.all,
        queryFn: async () => {
            const { data } = await api.get<unknown>('/tasks/team-leader');
            const raw = unwrapList<ApiTeamLeaderTask>(data);
            return raw.map(mapApiTaskToUi);
        },
    });
}

export function useCreateTask() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (input: CreateTaskInput) => {
            const defaultEnd = input.deadline
                ? new Date(input.deadline)
                : new Date(Date.now() + 4 * 60 * 60 * 1000);
            const defaultStart = new Date(defaultEnd.getTime() - 4 * 60 * 60 * 1000);
            const lat = input.latitude ?? 19.076;
            const lng = input.longitude ?? 72.8777;
            const body = {
                title: input.title,
                description: (input.description && input.description.trim()) || '—',
                template: 'WASTE_COLLECTION' as const,
                zoneName: input.locationLabel?.trim() || 'Field zone',
                geofenceLat: lat,
                geofenceLng: lng,
                geofenceRadius: 150,
                startTime: defaultStart.toISOString(),
                endTime: defaultEnd.toISOString(),
            };
            const { data } = await api.post<ApiTeamLeaderTask>('/tasks', body);
            let task = mapApiTaskToUi(data);
            if (input.assigneeIds?.length) {
                for (const uid of input.assigneeIds) {
                    await api.post(`/tasks/${task.id}/assign`, { userId: uid });
                }
                const { data: one } = await api.get<ApiTeamLeaderTask>(`/tasks/${task.id}`);
                task = mapApiTaskToUi(one);
            }
            return task;
        },
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: taskKeys.all });
            void qc.invalidateQueries({ queryKey: ['team-leader', 'dashboard'] });
            toast.success('Task created');
        },
        onError: (e) => toast.error(getApiErrorMessage(e, 'Could not create task')),
    });
}

export function useUpdateTaskStatus() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
            const { data } = await api.patch<ApiTeamLeaderTask>(`/tasks/${id}`, { status });
            return mapApiTaskToUi(data);
        },
        onSuccess: (updated) => {
            if (!updated) return;
            qc.setQueryData<Task[]>(taskKeys.all, (old) =>
                (old ?? []).map((t) => (t.id === updated.id ? { ...t, ...updated } : t)),
            );
            void qc.invalidateQueries({ queryKey: ['team-leader', 'dashboard'] });
            toast.success('Task updated');
        },
        onError: (e) => toast.error(getApiErrorMessage(e, 'Could not update task')),
    });
}

export function useBulkAssignTask() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, assigneeIds }: { id: string; assigneeIds: string[] }) => {
            const { data } = await api.patch<ApiTeamLeaderTask>(`/tasks/${id}`, { assigneeIds });
            return mapApiTaskToUi(data);
        },
        onSuccess: (updated) => {
            if (!updated) return;
            qc.setQueryData<Task[]>(taskKeys.all, (old) =>
                (old ?? []).map((t) => (t.id === updated.id ? { ...t, ...updated } : t)),
            );
            void qc.invalidateQueries({ queryKey: ['team-leader', 'dashboard'] });
            toast.success('Assignments saved');
        },
        onError: (e) => toast.error(getApiErrorMessage(e, 'Could not assign volunteers')),
    });
}
