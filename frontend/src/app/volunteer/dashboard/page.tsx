'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api/client';
import { useAuth } from '../../../context/AuthContext';
import { getApiErrorMessage } from '@/lib/api-errors';
import { buildAttendanceClockPayload } from '@/lib/clock-payload';
import { useDashboardStats, volunteerDashboardQueryKey } from '@/features/volunteer/hooks/useDashboardStats';
import { useActiveTasks, volunteerActiveTasksQueryKey } from '@/features/volunteer/hooks/useActiveTasks';
import { useAttendanceSummary, attendanceSummaryQueryKey } from '@/features/volunteer/hooks/useAttendanceSummary';
import { useReportSummary } from '@/features/volunteer/hooks/useReportSummary';
import { VolunteerDeploymentCard } from '@/features/volunteer/components/VolunteerDeploymentCard';
import {
    MapPin, CheckCircle, Loader2, AlertCircle,
    ClipboardList, Clock, CalendarDays,
    ChevronRight, Zap, Target, ArrowRight,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

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

const attendanceHistoryKey = ['volunteer', 'my-attendance-history'] as const;
const myReportsKey = ['volunteer', 'my-reports'] as const;

/** Latest attendance event today for this task (by timestamp). */
function lastTodayAttendanceForTask(history: AttendanceRow[], taskId: string): 'CLOCK_IN' | 'CLOCK_OUT' | null {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    let last: AttendanceRow | null = null;
    let lastMs = 0;
    for (const h of history) {
        if (h.taskId !== taskId) continue;
        const t = new Date(h.timestamp);
        const ms = t.getTime();
        if (ms < start.getTime() || ms > end.getTime()) continue;
        if (!last || ms > lastMs) {
            last = h;
            lastMs = ms;
        }
    }
    return last ? (last.type as 'CLOCK_IN' | 'CLOCK_OUT') : null;
}

function formatLastCheckInTime(iso: string | null): string {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleTimeString(undefined, {
            hour: 'numeric',
            minute: '2-digit',
        });
    } catch {
        return '—';
    }
}

function QuickAccessSummarySkeleton() {
    return (
        <div
            className="flex flex-col gap-2 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm animate-pulse"
            aria-busy="true"
        >
            <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-200 shrink-0" />
                <div className="flex-1 min-w-0 space-y-2 pt-0.5">
                    <div className="h-3.5 w-28 rounded bg-slate-200" />
                    <div className="h-2.5 w-full rounded bg-slate-100" />
                    <div className="h-2.5 w-20 rounded bg-slate-100" />
                </div>
            </div>
        </div>
    );
}

function DeploymentsSkeleton() {
    return (
        <div className="space-y-3" aria-busy="true" aria-label="Loading tasks">
            {[0, 1, 2].map((i) => (
                <div
                    key={i}
                    className="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse space-y-3"
                >
                    <div className="h-3 w-24 rounded bg-slate-200" />
                    <div className="h-5 w-[85%] max-w-[220px] rounded bg-slate-200" />
                    <div className="h-3 w-40 rounded bg-slate-100" />
                    <div className="h-3 w-48 rounded bg-slate-100" />
                    <div className="flex gap-2 pt-1">
                        <div className="flex-1 h-11 rounded-xl bg-slate-200" />
                        <div className="w-24 h-11 rounded-xl bg-slate-100" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function VolunteerDashboard() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const {
        data: dashStats,
        isLoading: statsLoading,
        isError: statsError,
    } = useDashboardStats();
    const {
        data: activeTasks = [],
        isPending: tasksPending,
        isFetching: tasksFetching,
        isError: tasksQueryError,
        error: tasksQueryFailure,
    } = useActiveTasks();
    const attendance = useAttendanceSummary();
    const reportSummary = useReportSummary();
    const {
        data: history = [],
        isPending: historyPending,
        isError: historyError,
        error: historyFailure,
    } = useQuery({
        queryKey: attendanceHistoryKey,
        queryFn: async () => {
            const { data } = await api.get<AttendanceRow[]>('/attendance/my-history');
            return Array.isArray(data) ? data : [];
        },
        staleTime: 20_000,
    });
    const { data: reportRows = [], isPending: reportsPending } = useQuery({
        queryKey: myReportsKey,
        queryFn: async () => (await api.get<ReportRow[]>('/reports/my-reports')).data,
        staleTime: 60_000,
    });

    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    useEffect(() => {
        if (statsError) {
            toast.error('Could not load dashboard stats. Showing zeros until retry.');
        }
    }, [statsError]);


    const recentReports = reportRows.slice(0, 5);
    const auxReady = !historyPending && !reportsPending;

    const today = new Date();
    const dateStr = today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <div className="min-h-screen bg-[#F0F7F4] pb-20">
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
                            {user?.firstName?.[0]}
                            {user?.lastName?.[0]}
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 mt-6 min-h-[5.5rem]">
                        {statsLoading ? (
                            <>
                                {[0, 1, 2, 3].map((i) => (
                                    <div
                                        key={i}
                                        className="bg-white/10 rounded-2xl p-3 text-center backdrop-blur-sm border border-white/10 animate-pulse"
                                    >
                                        <div className="w-4 h-4 mx-auto mb-1 rounded bg-white/20" />
                                        <div className="h-5 w-10 mx-auto rounded bg-white/20 mb-1" />
                                        <div className="h-2 w-8 mx-auto rounded bg-white/10" />
                                    </div>
                                ))}
                            </>
                        ) : (
                            [
                                { label: 'Month', value: `${dashStats?.totalHours ?? 0} HRS`, icon: Clock },
                                { label: 'Active', value: `${dashStats?.activeDays ?? 0} DAYS`, icon: CalendarDays },
                                { label: 'Done', value: String(dashStats?.tasksCompleted ?? 0), icon: CheckCircle },
                                { label: 'Streak', value: `${dashStats?.streakDays ?? 0}d`, icon: Zap },
                            ].map(({ label, value, icon: Icon }) => (
                                <div
                                    key={label}
                                    className="bg-white/10 rounded-2xl p-3 text-center backdrop-blur-sm border border-white/10"
                                >
                                    <Icon className="w-4 h-4 mx-auto mb-1 text-emerald-300" />
                                    <p className="text-[0.7rem] sm:text-[1.05rem] font-black leading-tight tabular-nums">{value}</p>
                                    <p className="text-[8px] font-bold text-emerald-200 uppercase tracking-wider mt-0.5">{label}</p>
                                </div>
                            ))
                        )}
                    </div>
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
                {historyError && (
                    <div className="bg-amber-50 text-amber-900 p-4 rounded-2xl text-sm font-medium border border-amber-100">
                        <p className="font-bold">Could not load attendance history</p>
                        <p className="mt-1 text-amber-800">
                            {getApiErrorMessage(historyFailure, 'Clock-in state may be wrong until this loads.')}
                        </p>
                        <button
                            type="button"
                            onClick={() => queryClient.invalidateQueries({ queryKey: attendanceHistoryKey })}
                            className="mt-3 text-sm font-bold text-amber-950 underline"
                        >
                            Retry
                        </button>
                    </div>
                )}

                <section>
                    <div className="flex items-center justify-between mb-3 gap-2">
                        <h2 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            Active Deployments
                            {tasksFetching && !tasksPending ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" aria-hidden />
                            ) : null}
                        </h2>
                        <Link
                            href="/volunteer/tasks"
                            className="text-xs font-bold text-emerald-600 flex items-center gap-1 shrink-0"
                        >
                            View all tasks
                            <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    {tasksQueryError ? (
                        <div className="bg-red-50 text-red-800 p-4 rounded-2xl text-sm font-medium border border-red-100">
                            <p className="font-bold">Could not load your tasks</p>
                            <p className="mt-1 text-red-700">
                                {getApiErrorMessage(tasksQueryFailure, 'Request failed. Try Refresh list or sign in again.')}
                            </p>
                            <button
                                type="button"
                                onClick={() => queryClient.invalidateQueries({ queryKey: volunteerActiveTasksQueryKey })}
                                className="mt-3 text-sm font-bold text-red-900 underline"
                            >
                                Retry
                            </button>
                        </div>
                    ) : tasksPending ? (
                        <DeploymentsSkeleton />
                    ) : activeTasks.length === 0 ? (
                        <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-slate-100">
                            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Target className="w-8 h-8 text-emerald-300" />
                            </div>
                            <p className="font-bold text-slate-700 mb-1">No tasks assigned</p>
                            <p className="text-sm text-slate-400">
                                When your coordinator assigns you to a field task, it will show up here.
                            </p>
                            <button
                                type="button"
                                onClick={() => queryClient.invalidateQueries({ queryKey: volunteerActiveTasksQueryKey })}
                                className="mt-4 text-sm font-bold text-emerald-600 underline"
                            >
                                Refresh list
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {activeTasks.slice(0, 3).map((task) => (
                                <VolunteerDeploymentCard
                                    key={task.id}
                                    task={task}
                                    lastTodayType={lastTodayAttendanceForTask(history, task.id)}
                                    // Removed clocking props, clock in/out is now exclusively via task details page.
                                    clockBusy={false}
                                    anyClockBusy={false}
                                    onClock={() => {}}
                                />
                            ))}
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

                {auxReady && recentReports.length > 0 && (
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
                                        <p className="font-semibold text-slate-800 text-sm truncate">
                                            {r.task?.title || 'Field Report'}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">
                                            {new Date(r.timestamp).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                            })}
                                            {' · '}
                                            {new Date(r.timestamp).toLocaleTimeString(undefined, {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                    <span
                                        className={`text-[9px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide flex-shrink-0 ${r.status === 'APPROVED'
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

                <section>
                    <h2 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-emerald-500 shrink-0" aria-hidden />
                        Quick Access
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                        {attendance.isPending ? (
                            <QuickAccessSummarySkeleton />
                        ) : (
                            <Link
                                href="../attendance"
                                className="group flex flex-col gap-1.5 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 active:scale-[0.98] transition-all duration-200 text-left"
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className="w-9 h-9 rounded-xl flex items-center justify-center border bg-blue-50 border-blue-100 group-hover:bg-blue-100/90 transition-colors shrink-0"
                                        aria-hidden
                                    >
                                        <CalendarDays className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-slate-800 leading-tight">
                                            Attendance History
                                        </p>
                                        {attendance.isError ? (
                                            <p className="text-[11px] text-slate-400 mt-1.5">
                                                Couldn&apos;t load summary. Tap to open history.
                                            </p>
                                        ) : (
                                            <>
                                                <p className="text-[11px] text-slate-500 mt-1.5">
                                                    Last check-in:{' '}
                                                    <span className="font-semibold text-slate-700 tabular-nums">
                                                        {formatLastCheckInTime(
                                                            attendance.data?.lastCheckIn ?? null,
                                                        )}
                                                    </span>
                                                </p>
                                                <p className="text-[11px] font-semibold text-slate-600 mt-0.5 tabular-nums">
                                                    {attendance.data?.totalEntries ?? 0} entries
                                                </p>
                                            </>
                                        )}
                                    </div>
                                    <ChevronRight
                                        className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 shrink-0 mt-0.5 transition-colors"
                                        aria-hidden
                                    />
                                </div>
                            </Link>
                        )}

                        {reportSummary.isPending ? (
                            <QuickAccessSummarySkeleton />
                        ) : (
                            <Link
                                href="../reports"
                                className="group flex flex-col gap-1.5 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 active:scale-[0.98] transition-all duration-200 text-left"
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className="w-9 h-9 rounded-xl flex items-center justify-center border bg-purple-50 border-purple-100 group-hover:bg-purple-100/90 transition-colors shrink-0"
                                        aria-hidden
                                    >
                                        <ClipboardList className="w-4 h-4 text-purple-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-slate-800 leading-tight">My Reports</p>
                                        {reportSummary.isError ? (
                                            <p className="text-[11px] text-slate-400 mt-1.5">
                                                Couldn&apos;t load summary. Tap to open reports.
                                            </p>
                                        ) : (
                                            <>
                                                <p className="text-[11px] font-semibold text-slate-700 mt-1.5 tabular-nums">
                                                    {reportSummary.data?.totalReports ?? 0} reports
                                                </p>
                                                <p className="text-[11px] text-slate-500 mt-0.5">
                                                    <span className="font-semibold text-emerald-700">
                                                        {reportSummary.data?.approvedCount ?? 0} approved
                                                    </span>
                                                    {' / '}
                                                    <span className="font-semibold text-amber-700">
                                                        {reportSummary.data?.pendingCount ?? 0} pending
                                                    </span>
                                                    {(reportSummary.data?.rejectedCount ?? 0) > 0 ? (
                                                        <span className="text-slate-400">
                                                            {' · '}
                                                            {reportSummary.data?.rejectedCount} rejected
                                                        </span>
                                                    ) : null}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                    <ChevronRight
                                        className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 shrink-0 mt-0.5 transition-colors"
                                        aria-hidden
                                    />
                                </div>
                            </Link>
                        )}

                        {[
                            {
                                href: '/volunteer/profile',
                                label: 'Leaves & Profile',
                                icon: CheckCircle,
                                iconBg: 'bg-amber-50',
                                iconColor: 'text-amber-600',
                                border: 'border-amber-100',
                            },
                            {
                                href: '/volunteer/tasks',
                                label: 'All Tasks',
                                icon: Target,
                                iconBg: 'bg-emerald-50',
                                iconColor: 'text-emerald-600',
                                border: 'border-emerald-100',
                            },
                        ].map(({ href, label, icon: Icon, iconBg, iconColor, border }) => (
                            <Link
                                key={href}
                                href={href}
                                className="group flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 active:scale-[0.98] transition-all duration-200"
                            >
                                <div
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center border ${iconBg} ${border} group-hover:opacity-90 transition-opacity`}
                                >
                                    <Icon className={`w-4 h-4 ${iconColor}`} />
                                </div>
                                <span className="text-xs font-bold text-slate-700 leading-tight flex-1 min-w-0">
                                    {label}
                                </span>
                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 shrink-0 transition-colors" />
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
