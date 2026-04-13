import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { getApiErrorMessage } from '@/lib/api-errors';
import { unwrapList } from '@/features/team-leader/lib/unwrap';
import type { AttendanceRow, TaskAttendanceRow } from '@/features/team-leader/types/team-leader';
import { toast } from 'sonner';

export const attendanceKeys = {
    all: ['attendance'] as const,
    task: (taskId: string) => ['attendance', 'task', taskId] as const,
};

export function useAttendance() {
    return useQuery({
        queryKey: attendanceKeys.all,
        queryFn: async () => {
            const { data } = await api.get<unknown>('/attendance/team-live');
            return unwrapList<AttendanceRow>(data);
        },
    });
}

export function useTaskAttendance(taskId: string | null) {
    return useQuery({
        queryKey: taskId ? attendanceKeys.task(taskId) : ['attendance', 'task', 'none'],
        queryFn: async () => {
            const { data } = await api.get<unknown>(`/attendance/task/${taskId}`);
            return unwrapList<TaskAttendanceRow>(data);
        },
        enabled: Boolean(taskId),
    });
}

export interface OverrideAttendanceInput {
    attendanceId: string;
    reason: string;
    action: 'APPROVE' | 'REJECT' | 'CORRECT';
}

export function useOverrideAttendance() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (body: OverrideAttendanceInput) => {
            const { data } = await api.post<unknown>('/attendance/override', body);
            return data;
        },
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: attendanceKeys.all });
            void qc.invalidateQueries({ queryKey: ['attendance', 'task'] });
            toast.success('Attendance override recorded');
        },
        onError: (e) => toast.error(getApiErrorMessage(e, 'Override failed')),
    });
}
