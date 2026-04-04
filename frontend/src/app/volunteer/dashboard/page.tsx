'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import api from '../../../lib/axios';
import { useAuth } from '../../../context/AuthContext';
import {
    MapPin, CheckCircle, Loader2, AlertCircle,
    Camera, ClipboardList, Clock, CalendarDays,
    ChevronRight, Zap, Target, ArrowRight,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

type AttendanceRow = {
    id: string;
    taskId: string | null;
    type: string;
    timestamp: string;
    task?: { title?: string; zoneName?: string };
};

type ReportRow = {
    id: string;
    timestamp: string;
    status: string;
    quantityItems?: number | null;
    task?: { title?: string; zoneName?: string };
};

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
    status?: string;
    priority?: string;
};

function computeStats(history: AttendanceRow[], tasks: Task[], reports: ReportRow[]) {
    const now = new Date();

    const thisMonthHistory = history.filter((h) => {
        const d = new Date(h.timestamp);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });

    const clockIns = thisMonthHistory.filter((h) => h.type === 'CLOCK_IN');
    const clockOuts = thisMonthHistory.filter((h) => h.type === 'CLOCK_OUT');

    let totalMs = 0;
    clockOuts.forEach((out) => {
        const outTime = new Date(out.timestamp);
        const matchIn = clockIns.find(
            (ci) => ci.taskId === out.taskId && new Date(ci.timestamp).toDateString() === outTime.toDateString(),
        );
        if (matchIn) totalMs += outTime.getTime() - new Date(matchIn.timestamp).getTime();
    });

    const totalHours = Math.floor(totalMs / 3600000);
    const attendedDays = new Set(clockIns.map((h) => new Date(h.timestamp).toDateString())).size;
    const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;

    const allDates = new Set(
        history.filter((h) => h.type === 'CLOCK_IN').map((h) => new Date(h.timestamp).toDateString()),
    );
    let streak = 0;
    for (let i = 0; i <= 60; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        if (allDates.has(d.toDateString())) {
            streak++;
        } else if (i === 0) {
            continue;
        } else {
            break;
        }
    }

    return { totalHours, attendedDays, completedTasks, streak, reportsCount: reports.length };
}

function lastTodayAttendanceForTask(history: AttendanceRow[], taskId: string): 'CLOCK_IN' | 'CLOCK_OUT' | null {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    for (const h of history) {
        if (h.taskId !== taskId) continue;
        const t = new Date(h.timestamp);
        if (t >= start && t <= end) return h.type as 'CLOCK_IN' | 'CLOCK_OUT';
    }
    return null;
}

const PRIORITY_DOT: Record<string, string> = {
    HIGH: 'bg-red-500',
    MEDIUM: 'bg-amber-400',
    LOW: 'bg-emerald-500',
};

export default function VolunteerDashboard() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [history, setHistory] = useState<AttendanceRow[]>([]);
    const [reports, setReports] = useState<ReportRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [clocking, setClocking] = useState<string | null>(null);
    const [clockAction, setClockAction] = useState<'in' | 'out' | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const fetchAll = useCallback(async () => {
        try {
            setLoading(true);
            const [tasksRes, histRes, repRes] = await Promise.all([
                api.get('/tasks/my-tasks'),
                api.get('/attendance/my-history'),
                api.get('/reports/my-reports'),
            ]);
            setTasks(tasksRes.data);
            setHistory(histRes.data);
            setReports(repRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const getDeviceId = () => {
        let deviceId = localStorage.getItem('device_id');
        if (!deviceId) {
            deviceId = `WEB_${uuidv4()}`;
            localStorage.setItem('device_id', deviceId);
        }
        return deviceId;
    };

    const attemptClock = (taskId: string, kind: 'in' | 'out') => {
        setErrorMsg(null);
        setSuccessMsg(null);
        setClocking(taskId);
        setClockAction(kind);

        if (!navigator.geolocation) {
            setErrorMsg('Geolocation not supported by your browser.');
            setClocking(null);
            setClockAction(null);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const payload = {
                        taskId,
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracyMeters: position.coords.accuracy,
                        uniqueRequestId: `REQ_${uuidv4()}`,
                        deviceId: getDeviceId(),
                    };
                    await api.post(kind === 'in' ? '/attendance/clock-in' : '/attendance/clock-out', payload);
                    setSuccessMsg(kind === 'in' ? 'Clocked in — GPS verified.' : 'Clocked out — shift logged.');
                    await fetchAll();
                } catch (error: unknown) {
                    const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
                    setErrorMsg(msg || `Failed to clock ${kind}.`);
                } finally {
                    setClocking(null);
                    setClockAction(null);
                }
            },
            (error) => {
                setErrorMsg('GPS Error: ' + error.message);
                setClocking(null);
                setClockAction(null);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
        );
    };

    const stats = computeStats(history, tasks, reports);
    const activeTasks = tasks.filter((t) => t.status !== 'COMPLETED');
    const recentReports = reports.slice(0, 5);

    const today = new Date();
    const dateStr = today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <div className="min-h-screen bg-[#F0F7F4] pb-20">
            {/* Hero Header */}
            <div className="bg-[#1B5E20] text-white px-5 pt-12 pb-8 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/[0.04] rounded-full pointer-events-none" />
                <div className="absolute top-24 -left-10 w-40 h-40 bg-emerald-400/10 rounded-full pointer-events-none" />

                <div className="relative z-10">
                    <p className="text-emerald-300 text-[10px] font-bold tracking-widest uppercase mb-2">{dateStr}</p>
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h1 className="text-[1.7rem] font-extrabold tracking-tight leading-tight">
                                Hello, {user?.firstName}!
                            </h1>
                            <p className="text-emerald-300 text-sm mt-0.5 font-medium">Ready to make impact today?</p>
                        </div>
                        <div className="w-14 h-14 flex-shrink-0 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center text-[1.4rem] font-black shadow-inner select-none">
                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </div>
                    </div>

                    {!loading && (
                        <div className="grid grid-cols-4 gap-2 mt-6">
                            {[
                                { label: 'Hrs', value: stats.totalHours, icon: Clock },
                                { label: 'Days', value: stats.attendedDays, icon: CalendarDays },
                                { label: 'Done', value: stats.completedTasks, icon: CheckCircle },
                                { label: 'Streak', value: `${stats.streak}d`, icon: Zap },
                            ].map(({ label, value, icon: Icon }) => (
                                <div key={label} className="bg-white/10 rounded-2xl p-3 text-center backdrop-blur-sm border border-white/10">
                                    <Icon className="w-4 h-4 mx-auto mb-1 text-emerald-300" />
                                    <p className="text-[1.1rem] font-black leading-none">{value}</p>
                                    <p className="text-[8px] font-bold text-emerald-200 uppercase tracking-wider mt-0.5">{label}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="px-4 mt-5 space-y-5">
                {errorMsg && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-2xl flex items-start text-sm font-medium border border-red-100">
                        <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                        <p>{errorMsg}</p>
                    </div>
                )}
                {successMsg && (
                    <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl flex items-start text-sm font-medium border border-emerald-100">
                        <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                        <p>{successMsg}</p>
                    </div>
                )}

                {/* Active Deployments */}
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                            Active Deployments
                        </h2>
                        <Link href="/volunteer/tasks" className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                            All tasks <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="py-16 flex flex-col items-center justify-center text-slate-400">
                            <Loader2 className="w-7 h-7 animate-spin mb-3 text-emerald-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Loading assignments…</span>
                        </div>
                    ) : activeTasks.length === 0 ? (
                        <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-slate-100">
                            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Target className="w-8 h-8 text-emerald-300" />
                            </div>
                            <p className="font-bold text-slate-700 mb-1">No active deployments</p>
                            <p className="text-sm text-slate-400">Enjoy your free time today!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {activeTasks.slice(0, 3).map((task) => {
                                const last = lastTodayAttendanceForTask(history, task.id);
                                const busy = clocking === task.id;
                                const isIn = last === 'CLOCK_IN';
                                const isDone = last === 'CLOCK_OUT';

                                return (
                                    <div
                                        key={task.id}
                                        className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
                                    >
                                        <div className="p-4">
                                            <div className="flex items-start justify-between gap-2 mb-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority || 'LOW']}`} />
                                                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                                            {task.template?.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                    <Link href={`/volunteer/task/${task.id}`}>
                                                        <h3 className="font-bold text-slate-800 text-[15px] leading-tight hover:text-emerald-700 transition-colors">
                                                            {task.title}
                                                        </h3>
                                                    </Link>
                                                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 font-medium">
                                                        <MapPin className="w-3 h-3" />{task.zoneName}
                                                    </p>
                                                </div>
                                                {isDone ? (
                                                    <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100 flex-shrink-0">
                                                        Completed
                                                    </span>
                                                ) : isIn ? (
                                                    <span className="text-[9px] font-bold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1 flex-shrink-0">
                                                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                                                        Active
                                                    </span>
                                                ) : null}
                                            </div>

                                            <div className="flex gap-2">
                                                {!isDone && (
                                                    <button
                                                        onClick={() => attemptClock(task.id, isIn ? 'out' : 'in')}
                                                        disabled={busy || clocking !== null}
                                                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.97] flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 ${
                                                            isIn
                                                                ? 'bg-amber-500 text-white'
                                                                : 'bg-[#388E3C] text-white'
                                                        }`}
                                                    >
                                                        {busy ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <Clock className="w-4 h-4" />
                                                                {isIn ? 'Clock Out' : 'Clock In'}
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                                <Link
                                                    href={`/volunteer/task/${task.id}/camera`}
                                                    className="px-4 py-3 rounded-xl border-2 border-emerald-200 text-emerald-700 font-bold text-sm flex items-center gap-1.5 bg-emerald-50/60 active:scale-[0.97] transition-transform"
                                                >
                                                    <Camera className="w-4 h-4" />
                                                    {isDone ? 'Report' : 'Photo'}
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {activeTasks.length > 3 && (
                                <Link
                                    href="/volunteer/tasks"
                                    className="flex items-center justify-center gap-2 py-3.5 text-sm font-bold text-emerald-700 bg-white rounded-2xl border border-emerald-100 shadow-sm active:scale-[0.98] transition-transform"
                                >
                                    +{activeTasks.length - 3} more tasks
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            )}
                        </div>
                    )}
                </section>

                {/* Recent Reports */}
                {!loading && recentReports.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <ClipboardList className="w-3.5 h-3.5 text-emerald-500" />
                                Recent Reports
                            </h2>
                            <Link href="/volunteer/reports" className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                See all <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50 overflow-hidden">
                            {recentReports.map((r) => (
                                <div key={r.id} className="px-4 py-3 flex items-center justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-800 text-sm truncate">{r.task?.title || 'Field Report'}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">
                                            {new Date(r.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            {' · '}
                                            {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <span
                                        className={`text-[9px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide flex-shrink-0 ${
                                            r.status === 'APPROVED'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                : r.status === 'REJECTED'
                                                  ? 'bg-red-50 text-red-600 border-red-100'
                                                  : 'bg-slate-100 text-slate-500 border-slate-200'
                                        }`}
                                    >
                                        {r.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Quick Access */}
                {!loading && (
                    <section>
                        <h2 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-3">Quick Access</h2>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { href: '/volunteer/attendance', label: 'Attendance History', icon: CalendarDays, iconBg: 'bg-blue-50', iconColor: 'text-blue-600', border: 'border-blue-100' },
                                { href: '/volunteer/reports', label: 'My Reports', icon: ClipboardList, iconBg: 'bg-purple-50', iconColor: 'text-purple-600', border: 'border-purple-100' },
                                { href: '/volunteer/profile', label: 'Leaves & Profile', icon: CheckCircle, iconBg: 'bg-amber-50', iconColor: 'text-amber-600', border: 'border-amber-100' },
                                { href: '/volunteer/tasks', label: 'All Tasks', icon: Target, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', border: 'border-emerald-100' },
                            ].map(({ href, label, icon: Icon, iconBg, iconColor, border }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm active:scale-[0.97] transition-transform"
                                >
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${iconBg} ${border}`}>
                                        <Icon className={`w-4 h-4 ${iconColor}`} />
                                    </div>
                                    <span className="text-xs font-bold text-slate-700 leading-tight">{label}</span>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
