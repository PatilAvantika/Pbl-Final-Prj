import api from '@/lib/api/client';

/** Normalized task row from GET /tasks/my-tasks (volunteer assigned tasks). */
export type VolunteerActiveTask = {
    id: string;
    title: string;
    description?: string | null;
    zoneName: string;
    template: string;
    startTime: string;
    endTime: string;
    lifecycleStatus: string;
    isActive: boolean;
    geofenceLat: number;
    geofenceLng: number;
    geofenceRadius: number;
};

function toIso(v: unknown): string {
    if (typeof v === 'string' && v.trim()) return v;
    if (v instanceof Date) return v.toISOString();
    if (v && typeof v === 'object' && typeof (v as Date).toISOString === 'function') {
        return (v as Date).toISOString();
    }
    const d = new Date(String(v ?? ''));
    if (Number.isNaN(d.getTime())) {
        if (typeof console !== 'undefined' && process.env.NODE_ENV === 'development') {
            console.warn('[volunteer-api] bad task date, using epoch', v);
        }
        return new Date(0).toISOString();
    }
    return d.toISOString();
}

function mapMyTasksRow(row: Record<string, unknown>): VolunteerActiveTask {
    return {
        id: String(row.id ?? ''),
        title: String(row.title ?? ''),
        description: row.description != null ? String(row.description) : null,
        zoneName: String(row.zoneName ?? ''),
        template: String(row.template ?? 'WASTE_COLLECTION'),
        startTime: toIso(row.startTime),
        endTime: toIso(row.endTime),
        lifecycleStatus: String(row.lifecycleStatus ?? 'PENDING'),
        isActive: Boolean(row.isActive),
        geofenceLat: Number(row.geofenceLat ?? 0),
        geofenceLng: Number(row.geofenceLng ?? 0),
        geofenceRadius: Number(row.geofenceRadius ?? 0) || 100,
    };
}

export type VolunteerDashboardStats = {
    totalHours: number;
    activeDays: number;
    tasksCompleted: number;
    streakDays: number;
    /** IANA zone used for month/streak (profile or ?timezone=) */
    timeZone?: string;
};

export async function getDashboardStats(): Promise<VolunteerDashboardStats> {
    const tz =
        typeof window !== 'undefined'
            ? Intl.DateTimeFormat().resolvedOptions().timeZone
            : undefined;
    const res = await api.get<VolunteerDashboardStats>('/volunteer/dashboard', {
        params: tz ? { timezone: tz } : undefined,
    });
    return res.data;
}

export async function getActiveTasks(): Promise<VolunteerActiveTask[]> {
    const res = await api.get<unknown[]>('/tasks/my-tasks');
    const raw = Array.isArray(res.data) ? res.data : [];
    if (process.env.NODE_ENV === 'development') {
        console.log('[volunteer-api] GET /tasks/my-tasks count=', raw.length);
    }
    if (!Array.isArray(res.data)) {
        if (typeof console !== 'undefined') {
            console.error('[volunteer-api] GET /tasks/my-tasks expected array, got', typeof res.data, res.data);
        }
    }
    return raw.map((item) => mapMyTasksRow(item as Record<string, unknown>));
}

export type VolunteerAttendanceSummary = {
    totalEntries: number;
    lastCheckIn: string | null;
};

export type VolunteerReportSummary = {
    totalReports: number;
    approvedCount: number;
    pendingCount: number;
    rejectedCount: number;
};

export const getAttendanceSummary = async (): Promise<VolunteerAttendanceSummary> => {
    const res = await api.get<VolunteerAttendanceSummary>('/volunteer/attendance-summary');
    return res.data;
};

export const getReportSummary = async (): Promise<VolunteerReportSummary> => {
    const res = await api.get<VolunteerReportSummary>('/volunteer/report-summary');
    return res.data;
};

/** Row from GET /volunteer/reports (includes task). */
export type VolunteerFieldReport = {
    id: string;
    taskId: string;
    userId: string;
    organizationId: string;
    beforePhotoUrl?: string | null;
    afterPhotoUrl?: string | null;
    quantityItems?: number | null;
    notes?: string | null;
    timestamp: string;
    status: string;
    task?: { id: string; title?: string; zoneName?: string } | null;
};

export const getReports = async (): Promise<VolunteerFieldReport[]> => {
    const res = await api.get<VolunteerFieldReport[]>('/volunteer/reports');
    return Array.isArray(res.data) ? res.data : [];
};

export const createReport = async (formData: FormData): Promise<VolunteerFieldReport> => {
    const res = await api.post<VolunteerFieldReport>('/volunteer/reports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
};

export type VolunteerProfile = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    timezone?: string | null;
};

export type VolunteerLeaveSummary = {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
};

export type VolunteerLeave = {
    id: string;
    userId: string;
    type: string;
    startDate: string;
    endDate: string;
    status: string;
    reason: string;
};

export type CreateVolunteerLeavePayload = {
    type: string;
    startDate: string;
    endDate: string;
    reason: string;
};

export const getProfile = async (): Promise<VolunteerProfile> => {
    const res = await api.get<VolunteerProfile>('/volunteer/profile');
    return res.data;
};

export const getLeaveSummary = async (): Promise<VolunteerLeaveSummary> => {
    const res = await api.get<VolunteerLeaveSummary>('/volunteer/leave-summary');
    return res.data;
};

export const getLeaves = async (): Promise<VolunteerLeave[]> => {
    const res = await api.get<VolunteerLeave[]>('/volunteer/leaves');
    return Array.isArray(res.data) ? res.data : [];
};

export const createLeave = async (data: CreateVolunteerLeavePayload): Promise<VolunteerLeave> => {
    const res = await api.post<VolunteerLeave>('/volunteer/leaves', data);
    return res.data;
};

export const cancelVolunteerLeave = async (leaveId: string): Promise<void> => {
    await api.delete(`/volunteer/leaves/${leaveId}`);
};
