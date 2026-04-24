import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { getApiErrorMessage } from '@/lib/api-errors';
import { unwrapList } from '@/features/team-leader/lib/unwrap';
import type { ReportSubmission } from '@/features/team-leader/types/team-leader';
import { toast } from 'sonner';

export const reportKeys = {
    all: ['reports', 'team-leader'] as const,
};

type FieldReportRow = {
    id: string;
    beforePhotoUrl?: string | null;
    afterPhotoUrl?: string | null;
    quantityItems?: number | null;
    notes?: string | null;
    status: string;
    timestamp: string;
    task?: { title?: string | null } | null;
    user?: { firstName?: string; lastName?: string } | null;
};

const IMG_PLACEHOLDER =
    'data:image/svg+xml,' +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" fill="#e2e8f0"><rect width="100%" height="100%"/></svg>',
    );

function parseGpsFromNotes(notes: string | null | undefined): { lat: number; lng: number } {
    if (!notes) return { lat: 0, lng: 0 };
    const m = notes.match(/\[GPS\s*(-?[\d.]+),\s*(-?[\d.]+)\]/);
    if (!m) return { lat: 0, lng: 0 };
    return { lat: parseFloat(m[1]) || 0, lng: parseFloat(m[2]) || 0 };
}

/** Map Prisma FieldReport (GET /reports/team-leader) → team-leader UI model */
export function mapFieldReportToSubmission(r: FieldReportRow): ReportSubmission {
    const { lat, lng } = parseGpsFromNotes(r.notes);
    const name =
        r.user?.firstName || r.user?.lastName
            ? `${r.user?.firstName ?? ''} ${r.user?.lastName ?? ''}`.trim()
            : 'Volunteer';
    const uiStatus: ReportSubmission['status'] =
        r.status === 'SUBMITTED' ? 'PENDING' : r.status === 'APPROVED' ? 'APPROVED' : 'REJECTED';
    return {
        id: r.id,
        volunteerName: name,
        taskTitle: r.task?.title ?? undefined,
        beforeImageUrl: r.beforePhotoUrl || IMG_PLACEHOLDER,
        afterImageUrl: r.afterPhotoUrl || IMG_PLACEHOLDER,
        wasteKg: r.quantityItems ?? 0,
        latitude: lat,
        longitude: lng,
        status: uiStatus,
        submittedAt: r.timestamp,
    };
}

export function useReports() {
    return useQuery({
        queryKey: reportKeys.all,
        queryFn: async () => {
            const { data } = await api.get<unknown>('/reports/team-leader');
            const rows = unwrapList<FieldReportRow>(data);
            return rows.map(mapFieldReportToSubmission);
        },
    });
}

export function useReviewReport() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: 'APPROVED' | 'REJECTED' }) => {
            const { data } = await api.patch<unknown>(`/reports/${id}/review`, { status });
            return data;
        },
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: reportKeys.all });
            void qc.invalidateQueries({ queryKey: ['team-leader', 'dashboard'] });
            toast.success('Report updated');
        },
        onError: (e) => toast.error(getApiErrorMessage(e, 'Could not update report')),
    });
}
