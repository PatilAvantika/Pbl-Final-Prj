export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface Volunteer {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    skills?: string[];
    availability?: string;
    avatarUrl?: string;
    teamId?: string | null;
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    deadline?: string;
    latitude?: number;
    longitude?: number;
    locationLabel?: string;
    requiredResources?: string[];
    open?: boolean;
    assigneeIds?: string[];
    attendanceCount?: number;
    reportCount?: number;
}

export interface TaskAttendanceRow {
    userId: string;
    name: string;
    clockInAt: string | null;
    clockOutAt: string | null;
    status: 'PRESENT' | 'NOT_CHECKED_IN' | 'CHECKED_OUT';
}

export interface AttendanceRow {
    id: string;
    volunteerId: string;
    name: string;
    checkInAt: string;
    gpsOk: boolean;
    faceMatchScore?: number | null;
    suspicious?: boolean;
}

export interface ReportSubmission {
    id: string;
    volunteerName: string;
    taskTitle?: string;
    beforeImageUrl: string;
    afterImageUrl: string;
    wasteKg: number;
    latitude: number;
    longitude: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    submittedAt: string;
}

export interface ResourceItem {
    id: string;
    name: string;
    unit: string;
    quantity: number;
}
