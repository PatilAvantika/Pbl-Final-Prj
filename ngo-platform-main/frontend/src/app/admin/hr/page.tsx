'use client';

import { useState } from 'react';
import api from '../../../lib/api/client';
import { getApiErrorMessage } from '../../../lib/api-errors';
import { Users, FileText, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import { hasPermission } from '../../../lib/permissions';

function unwrapLeaveList(data: unknown): any[] {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data: unknown }).data)) {
        return (data as { data: any[] }).data;
    }
    return [];
}

export default function HrDashboardPage() {
    const { user } = useAuth();
    const canManagePayroll = hasPermission(user?.role, 'managePayroll');
    const [activeTab, setActiveTab] = useState<'leaves' | 'payslips'>('leaves');
    const [payrollUserId, setPayrollUserId] = useState('');
    const [payrollMonth, setPayrollMonth] = useState(new Date().getMonth() + 1);
    const [payrollYear, setPayrollYear] = useState(new Date().getFullYear());
    const [payslipFilterMonth, setPayslipFilterMonth] = useState('ALL');
    const [payslipFilterYear, setPayslipFilterYear] = useState('ALL');
    const queryClient = useQueryClient();

    const {
        data: leavesRaw,
        isLoading: loadingLeaves,
        isError: leavesError,
        error: leavesErrorObj,
        refetch: refetchLeaves,
    } = useQuery({
        queryKey: ['hr-leaves'],
        queryFn: async () => {
            const res = await api.get<unknown>('/hr/leaves/all?limit=200');
            return unwrapLeaveList(res.data);
        },
        enabled: activeTab === 'leaves',
    });
    const leaves = leavesRaw ?? [];

    const { data: payslips = [], isLoading: loadingPayslips } = useQuery({
        queryKey: ['hr-payslips', payslipFilterMonth, payslipFilterYear],
        queryFn: async () => {
            const params = new URLSearchParams({ limit: '200' });
            if (payslipFilterMonth !== 'ALL') params.set('month', payslipFilterMonth);
            if (payslipFilterYear !== 'ALL') params.set('year', payslipFilterYear);
            return (await api.get(`/hr/payslips/all?${params.toString()}`)).data;
        },
        enabled: activeTab === 'payslips',
    });

    const loading = activeTab === 'leaves' ? loadingLeaves : loadingPayslips;

    const updateLeaveMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: 'APPROVED' | 'REJECTED' }) =>
            api.put(`/hr/leaves/${id}/status`, { status }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['hr-leaves'] });
        },
    });

    const handleLeaveStatusUpdate = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        try {
            await updateLeaveMutation.mutateAsync({ id, status });
        } catch (err) {
            alert("Failed to update status");
        }
    };

    const handleViewPayslip = (pdfUrl?: string) => {
        if (!pdfUrl) {
            alert('PDF is not generated for this payslip yet.');
            return;
        }
        window.open(pdfUrl, '_blank', 'noopener,noreferrer');
    };

    const handleGeneratePayslip = async () => {
        if (!payrollUserId.trim()) {
            alert('Please provide user id for generation');
            return;
        }
        try {
            await api.post(`/hr/payslips/generate/${payrollUserId.trim()}/${payrollYear}/${payrollMonth}`);
            queryClient.invalidateQueries({ queryKey: ['hr-payslips'] });
            alert('Payslip generated successfully');
        } catch (err) {
            alert('Failed to generate payslip');
        }
    };

    const exportPayslipsCsv = () => {
        if (!payslips.length) {
            alert('No payslip data to export');
            return;
        }
        const header = ['StaffName', 'Role', 'Month', 'Year', 'AttendanceDays', 'Absences', 'BaseSalary', 'Deductions', 'NetPay', 'PdfUrl'];
        const rows = payslips.map((slip: any) => [
            `"${(slip.user?.firstName || '')} ${(slip.user?.lastName || '')}"`,
            slip.user?.role || '',
            slip.month,
            slip.year,
            slip.attendanceDays,
            slip.absences,
            slip.baseSalary,
            slip.deductions,
            slip.netPay,
            slip.pdfUrl || '',
        ]);
        const csv = [header.join(','), ...rows.map((row: any[]) => row.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `payslips-${Date.now()}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">HR & Payroll</h1>
                    <p className="text-slate-500 font-medium">Manage volunteer leaves and monitor staff payroll.</p>
                </div>
            </div>

            {activeTab === 'leaves' && leavesError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        Could not load leave requests: {getApiErrorMessage(leavesErrorObj, 'Request failed')}
                    </span>
                    <button
                        type="button"
                        onClick={() => void refetchLeaves()}
                        className="rounded-xl bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"
                    >
                        Retry
                    </button>
                </div>
            )}

            <div className="flex space-x-2 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('leaves')}
                    className={`px-4 py-3 font-bold text-sm border-b-2 transition-colors ${activeTab === 'leaves' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    Leave Requests
                </button>
                <button
                    onClick={() => setActiveTab('payslips')}
                    className={`px-4 py-3 font-bold text-sm border-b-2 transition-colors ${activeTab === 'payslips' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    Payroll & Payslips
                </button>
            </div>

            {loading ? (
                <div className="h-64 flex items-center justify-center bg-white rounded-3xl border border-slate-200">
                    <span className="animate-pulse font-bold text-slate-400">Loading HR Records...</span>
                </div>
            ) : activeTab === 'leaves' && leavesError ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 px-6 py-12 text-center text-slate-600">
                    <p className="font-bold text-slate-800">Leave list unavailable</p>
                    <p className="mt-1 text-sm">Fix the error above or retry after checking your role and API connection.</p>
                </div>
            ) : activeTab === 'leaves' ? (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                                    <th className="px-6 py-4 border-b border-slate-200">User</th>
                                    <th className="px-6 py-4 border-b border-slate-200">Type</th>
                                    <th className="px-6 py-4 border-b border-slate-200">Dates</th>
                                    <th className="px-6 py-4 border-b border-slate-200">Reason</th>
                                    <th className="px-6 py-4 border-b border-slate-200">Status</th>
                                    <th className="px-6 py-4 border-b border-slate-200 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm font-medium">
                                {leaves.map((leave: any) => (
                                    <tr key={leave.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs uppercase">
                                                    {leave.user?.firstName?.[0]}{leave.user?.lastName?.[0]}
                                                </div>
                                                <div>
                                                    <p className="text-slate-800 font-bold">{leave.user?.firstName} {leave.user?.lastName}</p>
                                                    <p className="text-slate-500 text-xs">{leave.user?.role.replace('_', ' ')}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-extrabold uppercase tracking-widest">{leave.type.replace('_', ' ')}</span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            <div>{new Date(leave.startDate).toLocaleDateString()}</div>
                                            <div className="text-xs text-slate-400">to {new Date(leave.endDate).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 truncate max-w-xs">{leave.reason}</td>
                                        <td className="px-6 py-4">
                                            {leave.status === 'PENDING' && <span className="flex items-center text-orange-500 bg-orange-50 px-2 py-1 rounded w-fit text-xs font-bold"><Clock className="w-3 h-3 mr-1" /> Pending</span>}
                                            {leave.status === 'APPROVED' && <span className="flex items-center text-emerald-500 bg-emerald-50 px-2 py-1 rounded w-fit text-xs font-bold"><CheckCircle className="w-3 h-3 mr-1" /> Approved</span>}
                                            {leave.status === 'REJECTED' && <span className="flex items-center text-red-500 bg-red-50 px-2 py-1 rounded w-fit text-xs font-bold"><XCircle className="w-3 h-3 mr-1" /> Rejected</span>}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {leave.status === 'PENDING' && (
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button onClick={() => handleLeaveStatusUpdate(leave.id, 'APPROVED')} className="text-emerald-600 hover:text-white hover:bg-emerald-500 border border-emerald-500 px-3 py-1 rounded text-xs transition-colors font-bold">Approve</button>
                                                    <button onClick={() => handleLeaveStatusUpdate(leave.id, 'REJECTED')} className="text-red-500 hover:text-white hover:bg-red-500 border border-red-500 px-3 py-1 rounded text-xs transition-colors font-bold">Reject</button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {leaves.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-slate-400 font-medium">No leave requests found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    {canManagePayroll && (
                        <div className="p-4 border-b border-slate-100 grid grid-cols-1 lg:grid-cols-5 gap-3">
                        <input
                            value={payrollUserId}
                            onChange={(e) => setPayrollUserId(e.target.value)}
                            placeholder="User ID for manual generation"
                            className="px-3 py-2 rounded-xl border border-slate-200 text-sm"
                        />
                        <input
                            type="number"
                            min={1}
                            max={12}
                            value={payrollMonth}
                            onChange={(e) => setPayrollMonth(parseInt(e.target.value || '1'))}
                            className="px-3 py-2 rounded-xl border border-slate-200 text-sm"
                        />
                        <input
                            type="number"
                            min={2000}
                            value={payrollYear}
                            onChange={(e) => setPayrollYear(parseInt(e.target.value || String(new Date().getFullYear())))}
                            className="px-3 py-2 rounded-xl border border-slate-200 text-sm"
                        />
                        <button onClick={handleGeneratePayslip} className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold">
                            Generate Payslip
                        </button>
                        <button onClick={exportPayslipsCsv} className="px-3 py-2 rounded-xl bg-slate-800 text-white text-sm font-bold">
                            Export CSV
                        </button>
                        </div>
                    )}
                    <div className="px-4 pb-4 pt-2 border-b border-slate-100 flex items-center gap-3">
                        <select value={payslipFilterMonth} onChange={(e) => setPayslipFilterMonth(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700">
                            <option value="ALL">All Months</option>
                            {Array.from({ length: 12 }).map((_, idx) => (
                                <option key={idx + 1} value={String(idx + 1)}>{idx + 1}</option>
                            ))}
                        </select>
                        <select value={payslipFilterYear} onChange={(e) => setPayslipFilterYear(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700">
                            <option value="ALL">All Years</option>
                            {[new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2].map((year) => (
                                <option key={year} value={String(year)}>{year}</option>
                            ))}
                        </select>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                                    <th className="px-6 py-4 border-b border-slate-200">Staff Member</th>
                                    <th className="px-6 py-4 border-b border-slate-200">Period</th>
                                    <th className="px-6 py-4 border-b border-slate-200">Attendance</th>
                                    <th className="px-6 py-4 border-b border-slate-200">Base Salary</th>
                                    <th className="px-6 py-4 border-b border-slate-200">Deductions</th>
                                    <th className="px-6 py-4 border-b border-slate-200">Net Pay</th>
                                    <th className="px-6 py-4 border-b border-slate-200 text-right">Document</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm font-medium">
                                {payslips.map((slip: any) => (
                                    <tr key={slip.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <Users className="w-4 h-4 text-slate-400" />
                                                <div>
                                                    <p className="text-slate-800 font-bold">{slip.user?.firstName} {slip.user?.lastName}</p>
                                                    <p className="text-slate-500 text-xs">{slip.user?.role.replace('_', ' ')}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 font-bold">{slip.month} / {slip.year}</td>
                                        <td className="px-6 py-4 text-slate-600">
                                            <div className="flex items-center space-x-2">
                                                <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-bold text-xs">{slip.attendanceDays} Days</span>
                                                {slip.absences > 0 && <span className="text-red-500 bg-red-50 px-2 py-0.5 rounded font-bold text-xs">{slip.absences} Absent</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">₹{slip.baseSalary.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-slate-600 font-medium">
                                            {slip.deductions > 0 ? (
                                                <span className="text-red-500">-₹{slip.deductions.toLocaleString()}</span>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-800 font-extrabold bg-slate-100 px-3 py-1 rounded border border-slate-200">₹{slip.netPay.toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => handleViewPayslip(slip.pdfUrl)} className="text-emerald-600 hover:text-emerald-700 font-bold text-xs flex items-center justify-end space-x-1 group ml-auto">
                                                <FileText className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                                                <span>View PDF</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {payslips.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-slate-400 font-medium">No payroll data generated yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
