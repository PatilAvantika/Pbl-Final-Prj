'use client';

import { useState, useEffect } from 'react';
import api from '../../../lib/axios';
import { Users, FileText, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

export default function HrDashboardPage() {
    const [activeTab, setActiveTab] = useState<'leaves' | 'payslips'>('leaves');
    const [leaves, setLeaves] = useState([]);
    const [payslips, setPayslips] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'leaves') {
                const res = await api.get('/hr/leaves/all');
                setLeaves(res.data);
            } else {
                const res = await api.get('/hr/payslips/all');
                setPayslips(res.data);
            }
        } catch (err) {
            console.error("Failed to fetch HR data", err);
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveStatusUpdate = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        try {
            await api.put(`/hr/leaves/${id}/status`, { status });
            fetchData();
        } catch (err) {
            alert("Failed to update status");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">HR & Payroll</h1>
                    <p className="text-slate-500 font-medium">Manage volunteer leaves and monitor staff payroll.</p>
                </div>
            </div>

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
                                            <button className="text-emerald-600 hover:text-emerald-700 font-bold text-xs flex items-center justify-end space-x-1 group ml-auto">
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
