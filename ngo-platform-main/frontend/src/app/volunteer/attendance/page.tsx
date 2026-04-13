'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '../../../lib/api/client';
import { getApiErrorMessage } from '@/lib/api-errors';
import { Clock, CheckCircle, XCircle, Loader2, CalendarDays, TrendingUp, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

type AttendanceRow = {
    id: string;
    taskId: string | null;
    type: string;
    timestamp: string;
    task?: { title?: string; zoneName?: string };
};

function computeMonthStats(history: AttendanceRow[], year: number, month: number) {
    const thisMonth = history.filter((h) => {
        const d = new Date(h.timestamp);
        return d.getFullYear() === year && d.getMonth() === month;
    });

    const clockIns = thisMonth.filter((h) => h.type === 'CLOCK_IN');
    const clockOuts = thisMonth.filter((h) => h.type === 'CLOCK_OUT');
    const presentDays = new Set(clockIns.map((h) => new Date(h.timestamp).toDateString())).size;

    let totalMs = 0;
    clockOuts.forEach((out) => {
        const outTime = new Date(out.timestamp);
        const matchIn = clockIns.find(
            (ci) => ci.taskId === out.taskId && new Date(ci.timestamp).toDateString() === outTime.toDateString(),
        );
        if (matchIn) totalMs += outTime.getTime() - new Date(matchIn.timestamp).getTime();
    });

    const totalHours = Math.floor(totalMs / 3600000);
    const totalMin = Math.floor((totalMs % 3600000) / 60000);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let workingDays = 0;
    for (let d = 1; d <= daysInMonth; d++) {
        const day = new Date(year, month, d).getDay();
        if (day !== 0 && day !== 6) workingDays++;
    }

    const attendancePercent = workingDays > 0 ? Math.round((presentDays / workingDays) * 100) : 0;

    return { presentDays, totalHours, totalMin, workingDays, attendancePercent };
}

type DayStatus = 'present' | 'absent' | 'future' | 'today' | 'today-present' | 'weekend';

function getDayStatus(history: AttendanceRow[], year: number, month: number, day: number): DayStatus {
    const date = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = date.getDay();

    if (dayOfWeek === 0 || dayOfWeek === 6) return 'weekend';
    if (date > today) return 'future';

    const hasClockIn = history.some(
        (h) => h.type === 'CLOCK_IN' && new Date(h.timestamp).toDateString() === date.toDateString(),
    );

    if (date.getTime() === today.getTime()) {
        return hasClockIn ? 'today-present' : 'today';
    }
    return hasClockIn ? 'present' : 'absent';
}

const DAY_STYLE: Record<DayStatus, string> = {
    present: 'bg-[#1B5E20] text-white font-bold',
    absent: 'bg-red-50 text-red-400 border border-red-100 font-medium',
    future: 'bg-white text-slate-300 border border-slate-100',
    today: 'bg-amber-50 text-amber-600 border-2 border-amber-400 font-bold',
    'today-present': 'bg-[#2E7D32] text-white font-bold ring-2 ring-amber-400 ring-offset-1',
    weekend: 'bg-transparent text-slate-200',
};

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function shiftDuration(history: AttendanceRow[], row: AttendanceRow): string | null {
    if (row.type !== 'CLOCK_OUT' || !row.taskId) return null;
    const outTime = new Date(row.timestamp);
    const matchIn = history.find(
        (h) => h.taskId === row.taskId && h.type === 'CLOCK_IN' && new Date(h.timestamp).toDateString() === outTime.toDateString(),
    );
    if (!matchIn) return null;
    const diff = outTime.getTime() - new Date(matchIn.timestamp).getTime();
    if (diff <= 0) return null;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function AttendancePage() {
    const [history, setHistory] = useState<AttendanceRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const now = new Date();
    const [viewYear, setViewYear] = useState(now.getFullYear());
    const [viewMonth, setViewMonth] = useState(now.getMonth());

    const fetchHistory = useCallback(async () => {
        try {
            setFetchError(null);
            setLoading(true);
            const res = await api.get('/attendance/my-history');
            const rows = res.data;
            setHistory(Array.isArray(rows) ? rows : []);
        } catch (err: unknown) {
            setFetchError(getApiErrorMessage(err, 'Could not load attendance.'));
            setHistory([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const stats = computeMonthStats(history, viewYear, viewMonth);

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const calendarCells: (number | null)[] = [
        ...Array(firstDay).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();

    const prevMonth = () => {
        if (viewMonth === 0) {
            setViewYear((y) => y - 1);
            setViewMonth(11);
        } else {
            setViewMonth((m) => m - 1);
        }
    };

    const nextMonth = () => {
        if (isCurrentMonth) return;
        if (viewMonth === 11) {
            setViewYear((y) => y + 1);
            setViewMonth(0);
        } else {
            setViewMonth((m) => m + 1);
        }
    };

    const recent = [...history].reverse().slice(0, 15);

    return (
        <div className="min-h-screen bg-[#F0F7F4] pb-24">
            {/* Header */}
            <div className="bg-[#1B5E20] text-white px-5 pt-12 pb-6 rounded-b-[2rem] shadow-lg relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/[0.04] rounded-full pointer-events-none" />
                <div className="relative z-10">
                    <h1 className="text-2xl font-extrabold tracking-tight">Attendance</h1>
                    <p className="text-emerald-300 text-sm mt-0.5 font-medium">Your field presence record</p>
                </div>
            </div>

            <div className="px-4 mt-4 space-y-4">
                {loading ? (
                    <div className="py-24 flex flex-col items-center text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin mb-3 text-emerald-500" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Loading…</span>
                    </div>
                ) : fetchError ? (
                    <div className="bg-red-50 text-red-800 p-5 rounded-2xl border border-red-100">
                        <div className="flex gap-3">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold">Could not load attendance</p>
                                <p className="mt-1 text-sm text-red-700">{fetchError}</p>
                                <button
                                    type="button"
                                    onClick={() => void fetchHistory()}
                                    className="mt-4 text-sm font-bold text-red-900 underline"
                                >
                                    Retry
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: 'Days Present', value: stats.presentDays, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                { label: 'Hours Logged', value: `${stats.totalHours}h ${stats.totalMin}m`, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
                                { label: 'Attendance', value: `${stats.attendancePercent}%`, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
                            ].map(({ label, value, icon: Icon, color, bg }) => (
                                <div key={label} className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100 text-center">
                                    <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center mx-auto mb-2`}>
                                        <Icon className={`w-4 h-4 ${color}`} />
                                    </div>
                                    <p className="font-extrabold text-slate-800 text-base leading-tight">{value}</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Calendar card */}
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4">
                            {/* Month navigation */}
                            <div className="flex items-center justify-between mb-4">
                                <button
                                    onClick={prevMonth}
                                    className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 active:scale-90 transition-transform"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <h3 className="font-extrabold text-slate-800">
                                    {MONTHS[viewMonth]} {viewYear}
                                </h3>
                                <button
                                    onClick={nextMonth}
                                    disabled={isCurrentMonth}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform ${
                                        isCurrentMonth
                                            ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                                            : 'bg-slate-100 text-slate-600'
                                    }`}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Weekday headers */}
                            <div className="grid grid-cols-7 mb-2">
                                {WEEKDAYS.map((d, i) => (
                                    <div key={i} className="text-center text-[9px] font-bold text-slate-400 uppercase py-1">
                                        {d}
                                    </div>
                                ))}
                            </div>

                            {/* Days grid */}
                            <div className="grid grid-cols-7 gap-1">
                                {calendarCells.map((day, idx) => {
                                    if (day === null) return <div key={`empty-${idx}`} />;
                                    const status = getDayStatus(history, viewYear, viewMonth, day);
                                    return (
                                        <div
                                            key={day}
                                            className={`aspect-square rounded-lg flex items-center justify-center text-xs transition-all ${DAY_STYLE[status]}`}
                                        >
                                            {day}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Legend */}
                            <div className="flex items-center gap-3 mt-4 justify-center flex-wrap">
                                {[
                                    { color: 'bg-[#1B5E20]', label: 'Present' },
                                    { color: 'bg-red-50 border border-red-200', label: 'Absent' },
                                    { color: 'bg-amber-50 border-2 border-amber-400', label: 'Today' },
                                    { color: 'bg-white border border-slate-200', label: 'Upcoming' },
                                ].map(({ color, label }) => (
                                    <div key={label} className="flex items-center gap-1.5">
                                        <div className={`w-3 h-3 rounded ${color}`} />
                                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent log */}
                        <section>
                            <h2 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <CalendarDays className="w-3.5 h-3.5 text-emerald-500" />
                                Recent Log
                            </h2>

                            {recent.length === 0 ? (
                                <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-slate-100">
                                    <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <CalendarDays className="w-7 h-7 text-emerald-300" />
                                    </div>
                                    <p className="font-bold text-slate-700 mb-1">No attendance yet</p>
                                    <p className="text-xs text-slate-400">Clock in to a task to start tracking your presence</p>
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50 overflow-hidden">
                                    {recent.map((h) => {
                                        const duration = shiftDuration(history, h);
                                        return (
                                            <div key={h.id} className="px-4 py-3 flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                                            h.type === 'CLOCK_IN' ? 'bg-emerald-50' : 'bg-amber-50'
                                                        }`}
                                                    >
                                                        {h.type === 'CLOCK_IN' ? (
                                                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                                                        ) : (
                                                            <XCircle className="w-4 h-4 text-amber-600" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-slate-800 truncate">
                                                            {h.task?.title || 'General'}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 font-medium">{h.task?.zoneName}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <div className="flex items-center gap-1.5 justify-end mb-0.5">
                                                        <span
                                                            className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                                                h.type === 'CLOCK_IN'
                                                                    ? 'bg-emerald-50 text-emerald-600'
                                                                    : 'bg-amber-50 text-amber-600'
                                                            }`}
                                                        >
                                                            {h.type === 'CLOCK_IN' ? 'In' : 'Out'}
                                                        </span>
                                                        {duration && (
                                                            <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">
                                                                {duration}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-slate-400">
                                                        {new Date(h.timestamp).toLocaleDateString('en-IN', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                        })}
                                                        {' · '}
                                                        {new Date(h.timestamp).toLocaleTimeString([], {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    </>
                )}
            </div>
        </div>
    );
}
