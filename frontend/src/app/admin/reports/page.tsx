'use client';

import { useState, useEffect } from 'react';
import api from '../../../lib/axios';
import { FileText, Image as ImageIcon, CheckCircle, Package, User } from 'lucide-react';

export default function AdminReportsPage() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const res = await api.get('/reports');
            setReports(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Field Reports</h1>
                    <p className="text-slate-500 font-medium">Review photographic evidence and operation metrics submitted by field teams.</p>
                </div>
            </div>

            {loading ? (
                <div className="h-64 flex items-center justify-center bg-white rounded-3xl border border-slate-200">
                    <span className="animate-pulse font-bold text-slate-400">Loading submitted field reports...</span>
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
                            <div className="w-full md:w-56 shrink-0 bg-slate-100 flex items-center overflow-x-auto p-4 space-x-3 border-r border-slate-100 relative">
                                {(!report.beforePhotoUrl && !report.afterPhotoUrl) ? (
                                    <div className="w-full h-32 flex flex-col items-center justify-center text-slate-400">
                                        <ImageIcon className="w-8 h-8 opacity-50 mb-2" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">No VisData</span>
                                    </div>
                                ) : (
                                    <>
                                        {report.beforePhotoUrl && (
                                            <div className="relative aspect-square h-32 rounded-xl overflow-hidden shadow-sm shrink-0 border-2 border-slate-200">
                                                <div className="absolute top-1 left-1 bg-white/80 backdrop-blur px-1.5 py-0.5 rounded text-[8px] font-extrabold shadow-sm uppercase">PRE</div>
                                                <img src={report.beforePhotoUrl} className="w-full h-full object-cover" alt="Before" />
                                            </div>
                                        )}
                                        {report.afterPhotoUrl && (
                                            <div className="relative aspect-square h-32 rounded-xl overflow-hidden shadow-sm shrink-0 border-2 border-emerald-500">
                                                <div className="absolute top-1 left-1 bg-white/80 backdrop-blur px-1.5 py-0.5 rounded text-[8px] font-extrabold text-emerald-600 shadow-sm shadow-emerald-500/20 uppercase">POST</div>
                                                <img src={report.afterPhotoUrl} className="w-full h-full object-cover" alt="After" />
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Data Block */}
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="font-extrabold text-lg text-slate-800 leading-tight">{report.task?.title || 'Unknown Task'}</h3>
                                        <p className="text-xs text-slate-500 font-medium flex items-center mt-1">
                                            <User className="w-3 h-3 mr-1" /> User ID: {report.userId.substring(0, 8).toUpperCase()}
                                        </p>
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-1 rounded select-all whitespace-nowrap">
                                        {new Date(report.timestamp).toLocaleDateString()}
                                    </div>
                                </div>

                                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl mb-4">
                                    <p className="text-sm text-slate-600 font-medium italic">"{report.notes || 'No notes provided by operator.'}"</p>
                                </div>

                                <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
                                    <div className="flex items-center text-slate-600 font-bold text-sm bg-sky-50 text-sky-700 px-3 py-1.5 rounded-lg border border-sky-100">
                                        <Package className="w-4 h-4 mr-2" />
                                        {report.quantityItems || 0} Units Collected
                                    </div>

                                    <button className="text-emerald-600 font-bold text-xs flex items-center hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors">
                                        <CheckCircle className="w-4 h-4 mr-1.5" /> Approve Log
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
