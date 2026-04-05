'use client';

import { useEffect, useState } from 'react';
import api from '../../../lib/axios';
import { CheckCircle, XCircle, Clock, Loader2, CalendarDays } from 'lucide-react';

type AttRow = {
    id: string;
    taskId: string | null;
    type: string;
    timestamp: string;
    task?: { title?: string; zoneName?: string };
};

function shiftDuration(history: AttRow[], row: AttRow): string | null {
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

function groupByDate(rows: AttRow[]): [string, AttRow[]][] {
    const map = new Map<string, AttRow[]>();
    rows.forEach((r) => {
        const label = new Date(r.timestamp).toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
        });
        if (!map.has(label)) map.set(label, []);
        map.get(label)!.push(r);
    });
    return Array.from(map.entries());
}

export default function AttendanceHistoryPage() {
    const [history, setHistory] = useState<AttRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/attendance/my-history')
            .then((res) => setHistory(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const groups = groupByDate(history);

    return (
        <div className="min-h-screen bg-[#F0F7F4] pb-24">
            <div className="bg-[#1B5E20] text-white px-5 pt-12 pb-6 rounded-b-[2rem] shadow-lg relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/[0.04] rounded-full pointer-events-none" />
                <div className="relative z-10">
                    <h1 className="text-2xl font-extrabold tracking-tight">Attendance History</h1>
                    <p className="text-emerald-300 text-sm mt-0.5 font-medium">All your field check-ins</p>
                </div>
            </div>

            <div className="px-4 mt-4 space-y-4">
                {loading ? (
                    <div className="py-24 flex flex-col items-center justify-center text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin mb-3 text-emerald-500" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Loading…</span>
                    </div>
                ) : history.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-slate-100">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CalendarDays className="w-8 h-8 text-emerald-300" />
                        </div>
                        <p className="font-bold text-slate-700 mb-1">No attendance records</p>
                        <p className="text-sm text-slate-400">Clock in to a task to start tracking</p>
                    </div>
                ) : (
                    groups.map(([dateLabel, rows]) => (
                        <div key={dateLabel} className="space-y-2">
                            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">
                                {dateLabel}
                            </p>
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50 overflow-hidden">
                                {rows.map((h) => {
                                    const duration = shiftDuration(history, h);
                                    return (
                                        <div key={h.id} className="px-4 py-3 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${h.type === 'CLOCK_IN' ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                                                    {h.type === 'CLOCK_IN'
                                                        ? <CheckCircle className="w-4 h-4 text-emerald-600" />
                                                        : <XCircle className="w-4 h-4 text-amber-600" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-slate-800 truncate">{h.task?.title || 'General'}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium">{h.task?.zoneName}</p>
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <div className="flex items-center gap-1.5 justify-end mb-0.5">
                                                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${h.type === 'CLOCK_IN' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                        {h.type === 'CLOCK_IN' ? 'In' : 'Out'}
                                                    </span>
                                                    {duration && (
                                                        <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                                            <Clock className="w-2.5 h-2.5" /> {duration}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-slate-400">
                                                    {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
