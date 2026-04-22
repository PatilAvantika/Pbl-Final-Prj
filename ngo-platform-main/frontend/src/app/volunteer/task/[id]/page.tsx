'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api/client';
import { getApiErrorMessage } from '@/lib/api-errors';
import { buildAttendanceClockPayload } from '@/lib/clock-payload';
import { captureAttendanceFaceSequence } from '@/lib/clock-payload';
import {
    ArrowLeft, MapPin, Navigation, Clock, Camera,
    Loader2, AlertCircle, CheckCircle, ExternalLink, Calendar,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

type Task = {
    id: string;
    title: string;
    description?: string | null;
    template: string;
    zoneName: string;
    geofenceLat: number;
    geofenceLng: number;
    geofenceRadius: number;
    startTime: string;
    endTime: string;
    isActive: boolean;
    priority?: string;
};

type AttendanceRow = {
    id: string;
    taskId: string | null;
    type: string;
    timestamp: string;
};

function lastTodayStatus(history: AttendanceRow[], taskId: string): 'CLOCK_IN' | 'CLOCK_OUT' | null {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(23, 59, 59, 999);
    const todays = history
        .filter((h) => h.taskId === taskId && new Date(h.timestamp) >= start && new Date(h.timestamp) <= end)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return todays.length > 0 ? (todays[0].type as 'CLOCK_IN' | 'CLOCK_OUT') : null;
}

const TEMPLATE_LABELS: Record<string, string> = {
    WASTE_COLLECTION: 'Waste Collection',
    PLANTATION: 'Tree Plantation',
    AWARENESS: 'Awareness Campaign',
    SURVEY: 'Community Survey',
    TRAINING: 'Training Session',
};

const TEMPLATE_EMOJI: Record<string, string> = {
    WASTE_COLLECTION: '🗑️',
    PLANTATION: '🌱',
    AWARENESS: '📢',
    SURVEY: '📋',
    TRAINING: '🎓',
};

const PRIORITY_COLOR: Record<string, string> = {
    HIGH: 'bg-red-500',
    MEDIUM: 'bg-amber-400',
    LOW: 'bg-emerald-500',
};

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);

    const [task, setTask] = useState<Task | null>(null);
    const [history, setHistory] = useState<AttendanceRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [clocking, setClocking] = useState<'in' | 'out' | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [taskRes, histRes] = await Promise.all([
                api.get(`/tasks/${id}`),
                api.get('/attendance/my-history'),
            ]);
            setTask(taskRes.data);
            const rows = histRes.data;
            setHistory(Array.isArray(rows) ? rows : []);
        } catch (err: unknown) {
            setErrorMsg(getApiErrorMessage(err, 'Could not load task. You may not be assigned to it.'));
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const getDeviceId = () => {
        let deviceId = localStorage.getItem('device_id');
        if (!deviceId) { deviceId = `WEB_${uuidv4()}`; localStorage.setItem('device_id', deviceId); }
        return deviceId;
    };

    const attemptClock = async (kind: 'in' | 'out') => {
        setErrorMsg(null);
        setSuccessMsg(null);
        setClocking(kind);

        try {
            const faceCapture = await captureAttendanceFaceSequence();

            if (!navigator.geolocation) {
                setErrorMsg('Geolocation not supported by your browser.');
                setClocking(null);
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const payload = buildAttendanceClockPayload(
                            id,
                            position,
                            getDeviceId(),
                            `REQ_${uuidv4()}`,
                            faceCapture,
                        );
                        await api.post(kind === 'in' ? '/attendance/clock-in' : '/attendance/clock-out', payload);
                        setSuccessMsg(kind === 'in' ? 'Clocked in — GPS and face verified.' : 'Clocked out — shift logged.');
                        await fetchData();
                    } catch (error: unknown) {
                        setErrorMsg(getApiErrorMessage(error, `Failed to clock ${kind}.`));
                    } finally {
                        setClocking(null);
                    }
                },
                (err) => { setErrorMsg('GPS Error: ' + err.message); setClocking(null); },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
            );
        } catch (error: unknown) {
            setErrorMsg(getApiErrorMessage(error, `Failed to clock ${kind}.`));
            setClocking(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F0F7F4] flex flex-col items-center justify-center pb-20">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Loading task…</span>
            </div>
        );
    }

    if (!task) {
        return (
            <div className="min-h-screen bg-[#F0F7F4] flex flex-col items-center justify-center gap-4 pb-20 px-6">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
                <p className="text-slate-600 font-bold text-center">{errorMsg || 'Task not found.'}</p>
                <Link href="/volunteer/tasks" className="text-sm font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                    ← Back to Tasks
                </Link>
            </div>
        );
    }

    const last = lastTodayStatus(history, task.id);
    const showClockIn = last !== 'CLOCK_IN' && last !== 'CLOCK_OUT';
    const showClockOut = last === 'CLOCK_IN';
    const isDone = last === 'CLOCK_OUT';
    const mapsUrl = `https://www.openstreetmap.org/?mlat=${task.geofenceLat}&mlon=${task.geofenceLng}&zoom=16`;

    return (
        <div className="min-h-screen bg-[#F0F7F4] pb-24">
            {/* Header */}
            <div className="bg-[#1B5E20] text-white px-5 pt-12 pb-7 rounded-b-[2rem] shadow-xl relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/[0.04] rounded-full pointer-events-none" />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-5">
                        <button
                            onClick={() => router.back()}
                            className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                            <Navigation className="w-3 h-3" />
                            {TEMPLATE_LABELS[task.template] ?? task.template}
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="text-3xl">{TEMPLATE_EMOJI[task.template] ?? '📌'}</div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl font-extrabold tracking-tight leading-tight mb-1">{task.title}</h1>
                            <p className="text-emerald-300 text-sm font-medium flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                {task.zoneName}
                            </p>
                        </div>
                        {task.priority && (
                            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ${PRIORITY_COLOR[task.priority]}`} />
                        )}
                    </div>

                    {isDone && (
                        <div className="mt-4 bg-white/10 rounded-xl px-3 py-2 flex items-center gap-2 text-emerald-200 text-xs font-bold">
                            <CheckCircle className="w-4 h-4 text-emerald-300" />
                            Shift complete for today
                        </div>
                    )}
                    {last === 'CLOCK_IN' && (
                        <div className="mt-4 bg-amber-500/20 rounded-xl px-3 py-2 flex items-center gap-2 text-amber-200 text-xs font-bold border border-amber-400/20">
                            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                            Currently clocked in — shift active
                        </div>
                    )}
                </div>
            </div>

            <div className="px-4 mt-4 space-y-4">
                {/* Feedback */}
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

                {/* Time & geofence info */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 grid grid-cols-3 divide-x divide-slate-100">
                    {[
                        { icon: Clock, label: 'Start', value: new Date(task.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
                        { icon: Clock, label: 'End', value: new Date(task.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
                        { icon: MapPin, label: 'Radius', value: `${task.geofenceRadius}m` },
                    ].map(({ icon: Icon, label, value }) => (
                        <div key={label} className="p-4">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1 mb-1.5">
                                <Icon className="w-3 h-3" /> {label}
                            </p>
                            <p className="text-sm font-extrabold text-slate-800">{value}</p>
                        </div>
                    ))}
                </div>

                {/* Date */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center gap-3">
                    <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-emerald-100">
                        <Calendar className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Scheduled Date</p>
                        <p className="text-sm font-bold text-slate-800">
                            {new Date(task.startTime).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>

                {/* Description */}
                {task.description && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Task Briefing</p>
                        <p className="text-sm text-slate-700 leading-relaxed">{task.description}</p>
                    </div>
                )}

                {/* Map link */}
                <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-slate-200 bg-white text-slate-700 font-bold text-sm shadow-sm active:scale-[0.98] transition-transform"
                >
                    <ExternalLink className="w-4 h-4 text-emerald-500" />
                    View Zone on Map
                </a>

                {/* Clock actions */}
                <div className="flex flex-col gap-3">
                    {showClockIn && (
                        <button
                            onClick={() => attemptClock('in')}
                            disabled={clocking !== null}
                            className="w-full bg-[#388E3C] hover:bg-[#2E7D32] disabled:opacity-60 text-white font-bold py-4 rounded-2xl text-sm transition-all shadow-lg flex items-center justify-center gap-2 active:scale-[0.97]"
                        >
                            {clocking === 'in' ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Verifying GPS…</>
                            ) : (
                                <><Clock className="w-5 h-5" /> Clock In to Zone</>
                            )}
                        </button>
                    )}
                    {showClockOut && (
                        <button
                            onClick={() => attemptClock('out')}
                            disabled={clocking !== null}
                            className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-bold py-4 rounded-2xl text-sm transition-all shadow-lg flex items-center justify-center gap-2 active:scale-[0.97]"
                        >
                            {clocking === 'out' ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Verifying GPS…</>
                            ) : (
                                <><Clock className="w-5 h-5" /> Clock Out</>
                            )}
                        </button>
                    )}

                    <Link
                        href={`/volunteer/task/${id}/camera`}
                        className="w-full border-2 border-emerald-200 bg-emerald-50 text-emerald-800 font-bold py-4 rounded-2xl text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
                    >
                        <Camera className="w-5 h-5" />
                        Submit Field Report
                    </Link>
                </div>
            </div>
        </div>
    );
}
