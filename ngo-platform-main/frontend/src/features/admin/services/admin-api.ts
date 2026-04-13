import api from '@/lib/api/client';

export type AdminDashboardKpis = {
    activeTasks: number;
    volunteersOnField: number;
    reportsPending: number;
    syncFailures: number;
};

export const getDashboardStats = async (): Promise<AdminDashboardKpis> => {
    const res = await api.get<AdminDashboardKpis>('/admin/dashboard');
    return res.data;
};

export type AdminMapTask = {
    id: string;
    title: string;
    lat: number;
    lng: number;
    radius: number;
};

export type AdminMapVolunteer = {
    id: string;
    name: string;
    lat: number;
    lng: number;
    status: 'ACTIVE' | 'INACTIVE';
};

export type AdminMapData = {
    tasks: AdminMapTask[];
    volunteers: AdminMapVolunteer[];
};

export const getMapData = async (): Promise<AdminMapData> => {
    const res = await api.get<AdminMapData>('/admin/map-data');
    return res.data;
};
