import type { Task, Volunteer } from '@/features/team-leader/types/team-leader';

export function unwrapList<T>(data: unknown): T[] {
    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data: unknown }).data)) {
        return (data as { data: T[] }).data;
    }
    if (data && typeof data === 'object' && 'items' in data && Array.isArray((data as { items: unknown }).items)) {
        return (data as { items: T[] }).items;
    }
    return [];
}

export function unwrapTeamVolunteers(data: unknown): Volunteer[] {
    if (data && typeof data === 'object' && 'volunteers' in data) {
        const v = (data as { volunteers: unknown }).volunteers;
        if (Array.isArray(v)) return v as Volunteer[];
    }
    return unwrapList<Volunteer>(data);
}

export function unwrapTasks(data: unknown): Task[] {
    if (data && typeof data === 'object' && 'tasks' in data) {
        const t = (data as { tasks: unknown }).tasks;
        if (Array.isArray(t)) return t as Task[];
    }
    return unwrapList<Task>(data);
}
