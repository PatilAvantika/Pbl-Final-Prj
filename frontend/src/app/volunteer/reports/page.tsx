'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '../../../lib/axios';
import { Camera, ClipboardList, Loader2, MapPin, CheckCircle, Clock, AlertCircle } from 'lucide-react';

type ReportRow = {
    id: string;
    timestamp: string;
    status: string;
    quantityItems?: number | null;
    notes?: string | null;
    task?: { id?: string; title?: string; zoneName?: string };
};

const STATUS_STYLES: Record<string, string> = {
    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    REJECTED: 'bg-red-50 text-red-600 border-red-100',
    SUBMITTED: 'bg-slate-100 text-slate-600 border-slate-200',
    REVIEWED: 'bg-blue-50 text-blue-600 border-blue-100',
    FLAGGED: 'bg-orange-50 text-orange-600 border-orange-100',
};

const STATUS_ICON: Record<string, React.ReactNode> = {
    APPROVED: <CheckCircle className="w-3 h-3" />,
    REJECTED: <AlertCircle className="w-3 h-3" />,
    SUBMITTED: <Clock className="w-3 h-3" />,
    REVIEWED: <CheckCircle className="w-3 h-3" />,
    FLAGGED: <AlertCircle className="w-3 h-3" />,
};

export default function MyReportsPage() {
    const [reports, setReports] = useState<ReportRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/reports/my-reports')
            .then((res) => setReports(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const approved = reports.filter((r) => r.status === 'APPROVED').length;
    const pending = reports.filter((r) => r.status === 'SUBMITTED').length;

    return (
        <div className="min-h-screen bg-[#F0F7F4] pb-24">
            {/* Header */}
            <div className="bg-[#1B5E20] text-white px-5 pt-12 pb-6 rounded-b-[2rem] shadow-lg relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/[0.04] rounded-full pointer-events-none" />
                <div className="relative z-10">
                    <h1 className="text-2xl font-extrabold tracking-tight">Field Reports</h1>
                    <p className="text-emerald-300 text-sm mt-0.5 font-medium">
                        {reports.length} report{reports.length !== 1 ? 's' : ''} submitted
                    </p>
                </div>
            </div>

            <div className="px-4 mt-4 space-y-4">
                {/* Summary pills */}
                {!loading && reports.length > 0 && (
                    <div className="flex gap-3">
                        <div className="flex-1 bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm text-center">
                            <p className="text-xl font-extrabold text-emerald-600">{approved}</p>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">Approved</p>
                        </div>
                        <div className="flex-1 bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm text-center">
                            <p className="text-xl font-extrabold text-slate-700">{pending}</p>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">Under Review</p>
                        </div>
                        <div className="flex-1 bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm text-center">
                            <p className="text-xl font-extrabold text-blue-600">{reports.length}</p>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">Total</p>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="py-24 flex flex-col items-center justify-center text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin mb-3 text-emerald-500" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Loading…</span>
                    </div>
                ) : reports.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-slate-100">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ClipboardList className="w-8 h-8 text-emerald-300" />
                        </div>
                        <p className="font-bold text-slate-700 mb-1.5">No reports yet</p>
                        <p className="text-sm text-slate-400 mb-5">Submit your first field report by completing a task</p>
                        <Link
                            href="/volunteer/tasks"
                            className="inline-flex items-center gap-2 bg-[#388E3C] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm"
                        >
                            <Camera className="w-4 h-4" /> View My Tasks
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {reports.map((r) => {
                            const statusStyle = STATUS_STYLES[r.status] ?? STATUS_STYLES.SUBMITTED;
                            const statusIcon = STATUS_ICON[r.status] ?? STATUS_ICON.SUBMITTED;

                            return (
                                <div
                                    key={r.id}
                                    className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm"
                                >
                                    <div className="p-4">
                                        <div className="flex justify-between items-start gap-3 mb-2">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-slate-800 text-[15px] truncate">
                                                    {r.task?.title || 'Field Report'}
                                                </h3>
                                                {r.task?.zoneName && (
                                                    <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" />
                                                        {r.task.zoneName}
                                                    </p>
                                                )}
                                            </div>
                                            <span
                                                className={`text-[9px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide flex items-center gap-1 flex-shrink-0 ${statusStyle}`}
                                            >
                                                {statusIcon}
                                                {r.status}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium mb-2">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(r.timestamp).toLocaleDateString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                                {' · '}
                                                {new Date(r.timestamp).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                            {r.quantityItems != null && (
                                                <span className="bg-slate-100 px-2 py-0.5 rounded-full">
                                                    {r.quantityItems} items
                                                </span>
                                            )}
                                        </div>

                                        {r.notes && (
                                            <p className="text-xs text-slate-600 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100 leading-relaxed">
                                                {r.notes}
                                            </p>
                                        )}

                                        {r.task?.id && (
                                            <Link
                                                href={`/volunteer/task/${r.task.id}/camera`}
                                                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
                                            >
                                                <Camera className="w-3.5 h-3.5" /> Add another report
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
