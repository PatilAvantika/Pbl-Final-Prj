'use client';

import { useState, useEffect } from 'react';
import api from '../../../lib/axios';
import {
    Calendar, Loader2, LogOut, X, CheckCircle,
    Clock, ClipboardList, Star, Briefcase, Mail,
    AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

type AttRow = { id: string; taskId: string | null; type: string; timestamp: string };
type LeaveRow = { id: string; type: string; startDate: string; endDate: string; status: string; reason?: string };

function computeMonthStats(history: AttRow[]) {
    const now = new Date();
    const thisMonth = history.filter((h) => {
        const d = new Date(h.timestamp);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });

    const clockIns = thisMonth.filter((h) => h.type === 'CLOCK_IN');
    const clockOuts = thisMonth.filter((h) => h.type === 'CLOCK_OUT');
    const uniqueDays = new Set(clockIns.map((h) => new Date(h.timestamp).toDateString())).size;

    let totalMs = 0;
    clockOuts.forEach((out) => {
        const outTime = new Date(out.timestamp);
        const matchIn = clockIns.find(
            (ci) => ci.taskId === out.taskId && new Date(ci.timestamp).toDateString() === outTime.toDateString(),
        );
        if (matchIn) totalMs += outTime.getTime() - new Date(matchIn.timestamp).getTime();
    });

    const totalMin = Math.floor(totalMs / 60000);
    const totalHours = Math.floor(totalMin / 60);
    const remMin = totalMin % 60;
    const hoursLabel = totalMin === 0 ? '0h' : totalHours > 0 ? `${totalHours}h ${remMin}m` : `${remMin}m`;

    // Streak calculation
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

    return { uniqueDays, hoursLabel, streak, totalShifts: clockIns.length };
}

const LEAVE_TYPE_LABELS: Record<string, string> = {
    CASUAL: 'Casual',
    SICK: 'Sick',
    UNPAID: 'Unpaid',
    EMERGENCY: 'Emergency',
};

const LEAVE_TYPES = [
    { value: 'CASUAL', label: 'Casual', emoji: '🌴' },
    { value: 'SICK', label: 'Sick', emoji: '🤒' },
    { value: 'UNPAID', label: 'Unpaid', emoji: '💼' },
];

export default function MobileProfile() {
    const { user, logout } = useAuth();
    const [leaves, setLeaves] = useState<LeaveRow[]>([]);
    const [attendanceHistory, setAttendanceHistory] = useState<AttRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [leaveForm, setLeaveForm] = useState({ type: 'CASUAL', startDate: '', endDate: '', reason: '' });
    const [submitLoad, setSubmitLoad] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    useEffect(() => {
        fetchPersonalData();
    }, []);

    const fetchPersonalData = async () => {
        try {
            setLoading(true);
            const [leavesRes, histRes] = await Promise.all([
                api.get('/hr/leaves/my-leaves'),
                api.get('/attendance/my-history'),
            ]);
            setLeaves(leavesRes.data);
            setAttendanceHistory(histRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const cancelLeave = async (leaveId: string) => {
        if (!confirm('Cancel this leave request?')) return;
        try {
            await api.delete(`/hr/leaves/${leaveId}`);
            fetchPersonalData();
        } catch {
            alert('Failed to cancel leave request.');
        }
    };

    const submitLeaveRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitLoad(true);
        setSubmitError(null);
        try {
            await api.post('/hr/leaves', leaveForm);
            setShowForm(false);
            setLeaveForm({ type: 'CASUAL', startDate: '', endDate: '', reason: '' });
            fetchPersonalData();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setSubmitError(msg || 'Failed to submit request.');
        } finally {
            setSubmitLoad(false);
        }
    };

    const { uniqueDays, hoursLabel, streak } = computeMonthStats(attendanceHistory);

    const pendingLeaves = leaves.filter((l) => l.status === 'PENDING').length;
    const approvedLeaves = leaves.filter((l) => l.status === 'APPROVED').length;

    return (
        <div className="min-h-screen bg-[#F0F7F4] pb-24">
            {/* Profile Hero */}
            <div className="bg-[#1B5E20] text-white px-5 pt-12 pb-8 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/[0.04] rounded-full pointer-events-none" />
                <div className="absolute top-20 -left-8 w-32 h-32 bg-emerald-400/10 rounded-full pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-sm border-2 border-white/20 text-3xl font-black flex items-center justify-center shadow-inner mb-3 select-none">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                    <h1 className="text-xl font-extrabold tracking-tight">{user?.firstName} {user?.lastName}</h1>
                    <p className="text-emerald-300 text-sm mt-0.5 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" />
                        {user?.email}
                    </p>
                    <div className="bg-white/10 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mt-2.5 flex items-center gap-1.5">
                        <Briefcase className="w-3 h-3" />
                        {user?.role?.replace(/_/g, ' ')}
                    </div>
                </div>

                {/* This month stats */}
                {!loading && (
                    <div className="mt-6 grid grid-cols-3 gap-2 relative z-10">
                        {[
                            { label: 'Days', value: uniqueDays, icon: Calendar },
                            { label: 'Hours', value: hoursLabel, icon: Clock },
                            { label: 'Streak', value: `${streak}d`, icon: Star },
                        ].map(({ label, value, icon: Icon }) => (
                            <div key={label} className="bg-white/10 rounded-2xl p-3 text-center backdrop-blur-sm border border-white/10">
                                <Icon className="w-4 h-4 mx-auto mb-1 text-emerald-300" />
                                <p className="text-lg font-extrabold leading-tight">{value}</p>
                                <p className="text-[8px] font-bold text-emerald-200 uppercase tracking-widest mt-0.5">{label}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="px-4 mt-5 space-y-5">
                {/* Action row */}
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className={`flex-1 py-3 rounded-2xl font-bold shadow-sm transition-colors text-sm flex items-center justify-center gap-2 ${
                            showForm
                                ? 'bg-white text-slate-700 border border-slate-200'
                                : 'bg-[#388E3C] text-white'
                        }`}
                    >
                        <Calendar className="w-4 h-4" />
                        {showForm ? 'Cancel' : 'Request Leave'}
                    </button>
                    <button
                        onClick={logout}
                        className="w-14 bg-white text-red-500 border border-red-100 flex items-center justify-center rounded-2xl shadow-sm hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>

                {/* Leave request form */}
                {showForm && (
                    <form
                        onSubmit={submitLeaveRequest}
                        className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4"
                    >
                        <h3 className="font-extrabold text-slate-800">New Leave Request</h3>

                        {/* Leave type buttons */}
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-0.5">
                                Leave Type
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {LEAVE_TYPES.map(({ value, label, emoji }) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setLeaveForm({ ...leaveForm, type: value })}
                                        className={`py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-0.5 border-2 ${
                                            leaveForm.type === value
                                                ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                                                : 'bg-slate-50 border-transparent text-slate-600'
                                        }`}
                                    >
                                        <span className="text-base">{emoji}</span>
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-0.5">From</label>
                                <input
                                    required
                                    type="date"
                                    value={leaveForm.startDate}
                                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium focus:outline-none focus:border-emerald-400"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-0.5">To</label>
                                <input
                                    required
                                    type="date"
                                    value={leaveForm.endDate}
                                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium focus:outline-none focus:border-emerald-400"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between pl-0.5">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Reason</label>
                                <span className="text-[9px] text-slate-400">{leaveForm.reason.length}/200</span>
                            </div>
                            <textarea
                                required
                                maxLength={200}
                                rows={3}
                                value={leaveForm.reason}
                                onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                                placeholder="Briefly explain the reason…"
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium resize-none focus:outline-none focus:border-emerald-400"
                            />
                        </div>

                        {submitError && (
                            <div className="flex items-center gap-2 text-red-600 text-xs font-medium bg-red-50 p-3 rounded-xl border border-red-100">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {submitError}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitLoad}
                            className="w-full py-3 bg-[#388E3C] text-white rounded-xl font-bold text-sm shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                            {submitLoad ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Submit Request</>}
                        </button>
                    </form>
                )}

                {loading ? (
                    <div className="py-12 flex justify-center text-slate-400">
                        <Loader2 className="w-7 h-7 animate-spin text-emerald-500" />
                    </div>
                ) : (
                    <>
                        {/* Leave stats */}
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: 'Pending', value: pendingLeaves, color: 'text-amber-600', bg: 'bg-amber-50' },
                                { label: 'Approved', value: approvedLeaves, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                { label: 'Total', value: leaves.length, color: 'text-blue-600', bg: 'bg-blue-50' },
                            ].map(({ label, value, color, bg }) => (
                                <div key={label} className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm text-center">
                                    <div className={`text-xl font-extrabold ${color}`}>{value}</div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Leave history */}
                        <section>
                            <h2 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <ClipboardList className="w-3.5 h-3.5 text-emerald-500" />
                                Leave History
                            </h2>

                            {leaves.length === 0 ? (
                                <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-slate-100">
                                    <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Calendar className="w-7 h-7 text-emerald-300" />
                                    </div>
                                    <p className="font-bold text-slate-700 mb-1">No leave requests</p>
                                    <p className="text-xs text-slate-400">Apply for time off using the button above</p>
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    {leaves.map((lv) => (
                                        <div
                                            key={lv.id}
                                            className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[9px] font-extrabold uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">
                                                            {LEAVE_TYPE_LABELS[lv.type] ?? lv.type}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-800">
                                                        {new Date(lv.startDate).toLocaleDateString('en-IN', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                        })}
                                                        {' → '}
                                                        {new Date(lv.endDate).toLocaleDateString('en-IN', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                        })}
                                                    </p>
                                                    {lv.reason && (
                                                        <p className="text-xs text-slate-500 mt-1 font-medium">{lv.reason}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <span
                                                        className={`text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide border ${
                                                            lv.status === 'APPROVED'
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                                : lv.status === 'REJECTED'
                                                                  ? 'bg-red-50 text-red-600 border-red-100'
                                                                  : 'bg-amber-50 text-amber-700 border-amber-100'
                                                        }`}
                                                    >
                                                        {lv.status}
                                                    </span>
                                                    {lv.status === 'PENDING' && (
                                                        <button
                                                            onClick={() => cancelLeave(lv.id)}
                                                            className="w-7 h-7 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
                                                            title="Cancel leave"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </>
                )}
            </div>
        </div>
    );
}
