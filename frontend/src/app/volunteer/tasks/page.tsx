'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import api from '../../../lib/api/client';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
    MapPin, Clock, Loader2, AlertCircle, ChevronRight,
    Target, CheckCircle, Circle, Timer,
} from 'lucide-react';

type Task = {
    id: string;
    title: string;
    zoneName: string;
    template: string;
    startTime: string;
    endTime?: string;
    geofenceRadius: number;
    geofenceLat: number;
    geofenceLng: number;
    /** Prisma TaskLifecycleStatus from API */
    lifecycleStatus?: string;
    status?: string;
    priority?: string;
    description?: string;
};

/** Map API lifecycle to UI chip keys (STATUS_CHIP). */
function chipStatus(task: Task): string {
    const ls = task.lifecycleStatus ?? task.status;
    if (ls === 'ACTIVE') return 'IN_PROGRESS';
    if (ls === 'COMPLETED') return 'COMPLETED';
    if (ls === 'CANCELLED') return 'COMPLETED';
    if (ls === 'PENDING') return 'PENDING';
    return 'NOT_STARTED';
}

function isCompletedLifecycle(task: Task): boolean {
    const ls = task.lifecycleStatus ?? task.status;
    return ls === 'COMPLETED' || ls === 'CANCELLED';
}

const FILTERS = ['All', 'Active', 'Completed'] as const;
type FilterType = (typeof FILTERS)[number];

const PRIORITY_BAR: Record<string, string> = {
    HIGH: 'bg-red-500',
    MEDIUM: 'bg-amber-400',
    LOW: 'bg-emerald-500',
};

const PRIORITY_BADGE: Record<string, string> = {
    HIGH: 'bg-red-50 text-red-600 border-red-100',
    MEDIUM: 'bg-amber-50 text-amber-700 border-amber-100',
    LOW: 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

const STATUS_CHIP: Record<string, string> = {
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-100',
    PENDING: 'bg-slate-100 text-slate-600 border-slate-200',
    NOT_STARTED: 'bg-slate-100 text-slate-600 border-slate-200',
};

const STATUS_ICON: Record<string, React.ReactNode> = {
    COMPLETED: <CheckCircle className="w-3 h-3" />,
    IN_PROGRESS: <Timer className="w-3 h-3" />,
    PENDING: <Circle className="w-3 h-3" />,
    NOT_STARTED: <Circle className="w-3 h-3" />,
};

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [listError, setListError] = useState<string | null>(null);
    const [filter, setFilter] = useState<FilterType>('All');

    const fetchTasks = useCallback(async () => {
        try {
            setLoading(true);
            setListError(null);
            const res = await api.get<Task[]>('/tasks/my-tasks');
            const rows = Array.isArray(res.data) ? res.data : [];
            if (process.env.NODE_ENV === 'development') {
                console.log('Tasks:', rows);
            }
            if (!Array.isArray(res.data)) {
                console.error('[volunteer/tasks] GET /tasks/my-tasks expected array', res.data);
            }
            setTasks(rows);
        } catch (err) {
            console.error('[volunteer/tasks] GET /tasks/my-tasks failed', err);
            setTasks([]);
            setListError(getApiErrorMessage(err, 'Could not load tasks.'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const filteredTasks = tasks.filter((t) => {
        if (filter === 'Active') return !isCompletedLifecycle(t);
        if (filter === 'Completed') return isCompletedLifecycle(t);
        return true;
    });

    const isOverdue = (task: Task) => {
        if (isCompletedLifecycle(task)) return false;
        if (!task.endTime) return false;
        return new Date(task.endTime) < new Date();
    };

    const countByFilter = (f: FilterType) => {
        if (f === 'Active') return tasks.filter((t) => !isCompletedLifecycle(t)).length;
        if (f === 'Completed') return tasks.filter((t) => isCompletedLifecycle(t)).length;
        return tasks.length;
    };

    return (
        <div className="min-h-screen bg-[#F0F7F4] pb-24">
            {/* Header */}
            <div className="bg-[#1B5E20] text-white px-5 pt-12 pb-6 rounded-b-[2rem] shadow-lg relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/[0.04] rounded-full pointer-events-none" />
                <div className="relative z-10">
                    <h1 className="text-2xl font-extrabold tracking-tight">My Tasks</h1>
                    <p className="text-emerald-300 text-sm mt-0.5 font-medium">
                        {tasks.length} task{tasks.length !== 1 ? 's' : ''} assigned
                    </p>
                </div>
            </div>

            <div className="px-4 mt-4 space-y-4">
                {/* Filter tabs */}
                <div className="flex gap-2">
                    {FILTERS.map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                                filter === f
                                    ? 'bg-[#388E3C] text-white shadow-sm'
                                    : 'bg-white text-slate-600 border border-slate-200'
                            }`}
                        >
                            {f}
                            {!loading && (
                                <span
                                    className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                                        filter === f ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                                    }`}
                                >
                                    {countByFilter(f)}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {listError ? (
                    <div className="bg-red-50 text-red-800 p-4 rounded-2xl text-sm font-medium border border-red-100">
                        <p className="font-bold">Could not load tasks</p>
                        <p className="mt-1 text-red-700">{listError}</p>
                        <button
                            type="button"
                            onClick={() => void fetchTasks()}
                            className="mt-3 text-sm font-bold text-red-900 underline"
                        >
                            Retry
                        </button>
                    </div>
                ) : null}

                {loading ? (
                    <div className="py-24 flex flex-col items-center text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin mb-3 text-emerald-500" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Loading tasks…</span>
                    </div>
                ) : filteredTasks.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-slate-100">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Target className="w-8 h-8 text-emerald-300" />
                        </div>
                        <p className="font-bold text-slate-700 mb-1.5">
                            {filter === 'Completed'
                                ? 'No completed tasks yet'
                                : filter === 'Active'
                                  ? 'No active tasks'
                                  : 'No tasks assigned'}
                        </p>
                        <p className="text-sm text-slate-400">
                            {filter === 'Completed'
                                ? 'Complete your first task to see it here'
                                : 'Your coordinator can assign you from the admin console.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredTasks.map((task) => {
                            const overdue = isOverdue(task);
                            const status = chipStatus(task);
                            const priority = task.priority || 'LOW';

                            return (
                                <Link
                                    key={task.id}
                                    href={`/volunteer/task/${task.id}`}
                                    className={`block bg-white rounded-2xl shadow-sm border overflow-hidden active:scale-[0.98] transition-transform ${
                                        overdue ? 'border-red-200' : 'border-slate-100'
                                    }`}
                                >
                                    <div className="flex items-stretch">
                                        {/* Priority bar */}
                                        <div className={`w-1 flex-shrink-0 ${PRIORITY_BAR[priority]}`} />

                                        <div className="flex-1 p-4 min-w-0">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                                            {task.template?.replace(/_/g, ' ')}
                                                        </span>
                                                        {overdue && (
                                                            <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full border border-red-100 flex items-center gap-0.5">
                                                                <AlertCircle className="w-2.5 h-2.5" /> Overdue
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h3 className="font-bold text-slate-800 text-[15px] leading-tight mb-2">
                                                        {task.title}
                                                    </h3>
                                                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" />
                                                            {task.zoneName}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {new Date(task.startTime).toLocaleDateString('en-IN', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                                    <span
                                                        className={`text-[9px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide flex items-center gap-1 ${
                                                            STATUS_CHIP[status] ?? STATUS_CHIP.NOT_STARTED
                                                        }`}
                                                    >
                                                        {STATUS_ICON[status]}
                                                        {status.replace(/_/g, ' ')}
                                                    </span>
                                                    <span
                                                        className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                                                            PRIORITY_BADGE[priority]
                                                        }`}
                                                    >
                                                        {priority}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center pr-3 pl-1">
                                            <ChevronRight className="w-4 h-4 text-slate-300" />
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
