'use client';

import { useState } from 'react';
import api from '../../../lib/api/client';
import { Image as ImageIcon, CheckCircle, Package, User, XCircle, Maximize2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import { hasPermission } from '../../../lib/permissions';
import { getApiErrorMessage } from '@/lib/api-errors';

export default function AdminReportsPage() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const canReviewReports = hasPermission(user?.role, 'reviewReports');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'>('ALL');
    const [selectedReport, setSelectedReport] = useState<any | null>(null);
    const [reviewComment, setReviewComment] = useState('');
    const {
        data: reports = [],
        isLoading: loading,
        isError: reportsError,
        error: reportsFailure,
        refetch: refetchReports,
    } = useQuery({
        queryKey: ['admin-reports', statusFilter],
        queryFn: async () => {
            const { data } = await api.get(
                `/reports?limit=200${statusFilter === 'ALL' ? '' : `&status=${statusFilter}`}`,
            );
            return Array.isArray(data) ? data : [];
        },
    });
    const { data: reportAuditLogs = [] } = useQuery({
        queryKey: ['report-audit-logs', selectedReport?.id],
        queryFn: async () =>
            (await api.get(`/audit/logs?limit=50&entityType=FieldReport&entityId=${selectedReport!.id}`)).data,
        enabled: !!selectedReport?.id && canReviewReports,
    });

    const statusMutation = useMutation({
        mutationFn: async ({ id, status, comment }: { id: string; status: 'APPROVED' | 'REJECTED'; comment?: string }) =>
            api.put(`/reports/${id}/status`, { status, comment }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-reports'] }),
    });

    const updateStatus = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        try {
            if (status === 'REJECTED' && !reviewComment.trim()) {
                alert('Please add a rejection reason.');
                return;
            }
            await statusMutation.mutateAsync({ id, status, comment: reviewComment.trim() || undefined });
            setReviewComment('');
            setSelectedReport(null);
        } catch (err) {
            alert('Failed to update report status');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Field Reports</h1>
                    <p className="text-slate-500 font-medium">Review photographic evidence and operation metrics submitted by field teams.</p>
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700"
                >
                    <option value="ALL">All</option>
                    <option value="SUBMITTED">Submitted</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                </select>
            </div>

            {loading ? (
                <div className="h-64 flex items-center justify-center bg-white rounded-3xl border border-slate-200">
                    <span className="animate-pulse font-bold text-slate-400">Loading submitted field reports...</span>
                </div>
            ) : reportsError ? (
                <div className="bg-red-50 text-red-800 rounded-3xl border border-red-100 p-6">
                    <p className="font-bold">Could not load field reports</p>
                    <p className="mt-2 text-sm text-red-700">
                        {getApiErrorMessage(reportsFailure, 'Request failed. Check that you are signed in as admin or coordinator.')}
                    </p>
                    <button
                        type="button"
                        onClick={() => void refetchReports()}
                        className="mt-4 text-sm font-bold text-red-900 underline"
                    >
                        Retry
                    </button>
                </div>
            ) : reports.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500 font-medium">
                    No field reports have been logged in the system yet.
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {reports.map((report: any) => (
                        <div key={report.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row group">
                            {/* Image Preview Block */}
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedReport(report);
                                    setReviewComment('');
                                }}
                                className="w-full md:w-60 shrink-0 bg-slate-100 flex items-center overflow-x-auto p-4 space-x-3 border-r border-slate-100 relative text-left cursor-pointer hover:bg-slate-200/60 transition-colors group/photos"
                            >
                                {(!report.beforePhotoUrl && !report.afterPhotoUrl) ? (
                                    <div className="w-full h-32 flex flex-col items-center justify-center text-slate-400">
                                        <ImageIcon className="w-8 h-8 opacity-50 mb-2" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">No photos</span>
                                        <span className="text-[9px] font-medium text-slate-400 mt-1">Click to view report</span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="relative aspect-square h-32 rounded-xl overflow-hidden shadow-sm shrink-0 border-2 border-slate-200">
                                            <div className="absolute top-1 left-1 bg-white/80 backdrop-blur px-1.5 py-0.5 rounded text-[8px] font-extrabold shadow-sm uppercase z-[1]">Before</div>
                                            {report.beforePhotoUrl ? (
                                                <img src={report.beforePhotoUrl} className="w-full h-full object-cover" alt="Before site" />
                                            ) : (
                                                <div className="w-full h-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 px-2 text-center">No before photo</div>
                                            )}
                                        </div>
                                        <div className="relative aspect-square h-32 rounded-xl overflow-hidden shadow-sm shrink-0 border-2 border-emerald-500/80">
                                            <div className="absolute top-1 left-1 bg-white/80 backdrop-blur px-1.5 py-0.5 rounded text-[8px] font-extrabold text-emerald-700 shadow-sm uppercase z-[1]">After</div>
                                            {report.afterPhotoUrl ? (
                                                <img src={report.afterPhotoUrl} className="w-full h-full object-cover" alt="After site" />
                                            ) : (
                                                <div className="w-full h-full bg-emerald-50 flex items-center justify-center text-[10px] font-bold text-emerald-700/80 px-2 text-center">No after photo</div>
                                            )}
                                        </div>
                                        <div className="absolute bottom-2 right-2 opacity-0 group-hover/photos:opacity-100 transition-opacity pointer-events-none">
                                            <span className="inline-flex items-center gap-1 rounded-lg bg-white/95 px-2 py-1 text-[9px] font-bold text-slate-600 shadow border border-slate-200">
                                                <Maximize2 className="w-3 h-3" /> View
                                            </span>
                                        </div>
                                    </>
                                )}
                            </button>

                            {/* Data Block */}
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="font-extrabold text-lg text-slate-800 leading-tight">{report.task?.title || 'Unknown Task'}</h3>
                                        <p className="text-xs text-slate-500 font-medium flex items-center mt-1">
                                            <User className="w-3 h-3 mr-1" />
                                            {report.user
                                                ? `${report.user.firstName} ${report.user.lastName}`
                                                : `User ${report.userId.substring(0, 8).toUpperCase()}…`}
                                        </p>
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-1 rounded select-all whitespace-nowrap">
                                        {new Date(report.timestamp).toLocaleDateString()}
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <span className={`px-2 py-1 rounded text-[10px] font-extrabold uppercase tracking-widest ${report.status === 'APPROVED'
                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                            : report.status === 'REJECTED'
                                                ? 'bg-red-50 text-red-600 border border-red-100'
                                                : 'bg-orange-50 text-orange-600 border border-orange-100'
                                        }`}>
                                        {report.status || 'SUBMITTED'}
                                    </span>
                                </div>

                                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl mb-4">
                                    <p className="text-sm text-slate-600 font-medium italic">"{report.notes || 'No notes provided by operator.'}"</p>
                                </div>

                                <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
                                    <div className="flex items-center text-slate-600 font-bold text-sm bg-sky-50 text-sky-700 px-3 py-1.5 rounded-lg border border-sky-100">
                                        <Package className="w-4 h-4 mr-2" />
                                        {report.quantityItems || 0} Units Collected
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedReport(report);
                                                setReviewComment('');
                                            }}
                                            className="text-slate-700 font-bold text-xs flex items-center hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors border border-slate-200"
                                        >
                                            <Maximize2 className="w-4 h-4 mr-1.5" /> View photos
                                        </button>
                                        {canReviewReports && report.status === 'SUBMITTED' && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedReport(report);
                                                    setReviewComment('');
                                                }}
                                                className="text-emerald-600 font-bold text-xs flex items-center hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                <CheckCircle className="w-4 h-4 mr-1.5" /> Review
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedReport && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-end bg-slate-900/30 backdrop-blur-sm">
                    <div className="h-full w-full max-w-2xl bg-white border-l border-slate-200 shadow-xl overflow-auto">
                        <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
                            <div>
                                <h2 className="text-xl font-extrabold text-slate-800">Field report</h2>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">Photos, notes, and review</p>
                            </div>
                            <button type="button" onClick={() => setSelectedReport(null)} className="text-slate-500 hover:text-slate-700" aria-label="Close">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="rounded-xl border border-slate-200 p-4">
                                <p className="text-xs uppercase tracking-wider font-bold text-slate-500">Task</p>
                                <p className="text-sm font-bold text-slate-800">{selectedReport.task?.title || 'Unknown Task'}</p>
                                <p className="text-xs text-slate-500 mt-1">
                                    Submitted: {new Date(selectedReport.timestamp).toLocaleString()}
                                    {selectedReport.user && (
                                        <>
                                            {' · '}
                                            {selectedReport.user.firstName} {selectedReport.user.lastName}
                                        </>
                                    )}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-3">Site photos</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="rounded-xl border-2 border-slate-200 overflow-hidden bg-slate-50">
                                        <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 bg-slate-100 px-3 py-2 border-b border-slate-200">
                                            Before
                                        </div>
                                        {selectedReport.beforePhotoUrl ? (
                                            <a
                                                href={selectedReport.beforePhotoUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            >
                                                <img
                                                    src={selectedReport.beforePhotoUrl}
                                                    alt="Before — full size"
                                                    className="w-full h-56 object-cover hover:opacity-95 transition-opacity"
                                                />
                                            </a>
                                        ) : (
                                            <div className="h-56 flex items-center justify-center text-sm font-semibold text-slate-400 px-4 text-center">
                                                No before photo submitted
                                            </div>
                                        )}
                                    </div>
                                    <div className="rounded-xl border-2 border-emerald-200 overflow-hidden bg-emerald-50/30">
                                        <div className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-100/80 px-3 py-2 border-b border-emerald-200">
                                            After
                                        </div>
                                        {selectedReport.afterPhotoUrl ? (
                                            <a
                                                href={selectedReport.afterPhotoUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            >
                                                <img
                                                    src={selectedReport.afterPhotoUrl}
                                                    alt="After — full size"
                                                    className="w-full h-56 object-cover hover:opacity-95 transition-opacity"
                                                />
                                            </a>
                                        ) : (
                                            <div className="h-56 flex items-center justify-center text-sm font-semibold text-emerald-700/60 px-4 text-center">
                                                No after photo submitted
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {(selectedReport.beforePhotoUrl || selectedReport.afterPhotoUrl) && (
                                    <p className="text-[11px] text-slate-500 mt-2 font-medium">Click an image to open the full photo in a new tab.</p>
                                )}
                            </div>

                            <div className="rounded-xl border border-slate-200 p-4">
                                <p className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-2">Quantity</p>
                                <p className="text-sm font-bold text-slate-800">{selectedReport.quantityItems ?? 0} units</p>
                            </div>

                            <div className="rounded-xl border border-slate-200 p-4">
                                <p className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-2">Operator notes</p>
                                <p className="text-sm text-slate-700">{selectedReport.notes || 'No notes provided.'}</p>
                            </div>

                            {canReviewReports && selectedReport.status === 'SUBMITTED' && (
                                <>
                                    <div>
                                        <label className="text-xs uppercase tracking-wider font-bold text-slate-500">Reviewer comment / rejection reason</label>
                                        <textarea
                                            value={reviewComment}
                                            onChange={(e) => setReviewComment(e.target.value)}
                                            rows={4}
                                            placeholder="Add your review decision context..."
                                            className="mt-2 w-full border border-slate-200 rounded-xl p-3 text-sm"
                                        />
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => updateStatus(selectedReport.id, 'APPROVED')}
                                            className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-sm"
                                        >
                                            Approve report
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => updateStatus(selectedReport.id, 'REJECTED')}
                                            className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-sm"
                                        >
                                            Reject report
                                        </button>
                                    </div>
                                </>
                            )}

                            {canReviewReports && (
                                <div className="rounded-xl border border-slate-200 p-4">
                                    <p className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-3">Review history</p>
                                    <div className="space-y-3">
                                        {reportAuditLogs.length === 0 && <p className="text-sm text-slate-400">No audit entries found for this report.</p>}
                                        {reportAuditLogs.map((log: any) => (
                                            <div key={log.id} className="text-sm border border-slate-100 rounded-lg p-3">
                                                <p className="font-bold text-slate-700">
                                                    {log.actor?.firstName} {log.actor?.lastName} - {String(log.action).replaceAll('_', ' ')}
                                                </p>
                                                <p className="text-slate-500 text-xs">{new Date(log.createdAt).toLocaleString()}</p>
                                                {log.metadata?.status && (
                                                    <p className="text-slate-600 text-xs mt-1">
                                                        Status: {log.metadata.status}
                                                        {log.metadata.comment ? ` - ${log.metadata.comment}` : ''}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
