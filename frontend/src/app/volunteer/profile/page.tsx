'use client';

import { useState, useEffect } from 'react';
import api from '../../../lib/axios';
import { Calendar, UserCircle, Briefcase, FileText, Loader2, LogOut } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import ProtectedRoute from '../../../components/ProtectedRoute';

export default function MobileProfile() {
    const { user, logout } = useAuth();
    const [leaves, setLeaves] = useState([]);
    const [payslips, setPayslips] = useState([]);
    const [loading, setLoading] = useState(true);

    // Quick Leave Form
    const [showForm, setShowForm] = useState(false);
    const [leaveForm, setLeaveForm] = useState({ type: 'CASUAL', startDate: '', endDate: '', reason: '' });
    const [submitLoad, setSubmitLoad] = useState(false);

    useEffect(() => {
        fetchPersonalData();
    }, []);

    const fetchPersonalData = async () => {
        try {
            setLoading(true);
            const [leavesRes, payslipsRes] = await Promise.all([
                api.get('/hr/leaves/my-leaves'),
                api.get('/hr/payslips/my-payslips')
            ]);
            setLeaves(leavesRes.data);
            setPayslips(payslipsRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const submitLeaveRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitLoad(true);
        try {
            await api.post('/hr/leaves', leaveForm);
            setShowForm(false);
            setLeaveForm({ type: 'CASUAL', startDate: '', endDate: '', reason: '' });
            fetchPersonalData();
        } catch (err) {
            alert("Failed to submit request.");
        } finally {
            setSubmitLoad(false);
        }
    };

    return (
        <ProtectedRoute allowedRoles={['VOLUNTEER', 'STAFF', 'FIELD_COORDINATOR']}>
            <div className="min-h-screen bg-[#FAF9F6] pb-24">

                {/* Profile Header */}
                <div className="bg-slate-800 text-white p-6 rounded-b-[2.5rem] shadow-lg relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl"></div>

                    <div className="flex flex-col items-center mt-4">
                        <div className="w-20 h-20 rounded-full bg-slate-700/50 backdrop-blur border-2 border-white/20 text-3xl font-extrabold flex items-center justify-center shadow-inner mb-4">
                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </div>
                        <h1 className="text-2xl font-extrabold tracking-tight">{user?.firstName} {user?.lastName}</h1>
                        <div className="bg-slate-700 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mt-2 flex items-center shadow-inner">
                            <Briefcase className="w-3 h-3 justify-center mr-1" />
                            {user?.role.replace('_', ' ')}
                        </div>
                    </div>
                </div>

                <div className="p-5 mt-2 space-y-6">

                    {/* Action Row */}
                    <div className="flex space-x-3">
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className={`flex-1 ${showForm ? 'bg-slate-200 text-slate-800' : 'bg-emerald-500 text-white'} py-3 rounded-2xl font-bold shadow-sm transition-colors text-sm flex items-center justify-center`}
                        >
                            <Calendar className="w-4 h-4 mr-2" /> {showForm ? 'Cancel Application' : 'Request Time Off'}
                        </button>
                        <button onClick={logout} className="w-14 bg-white text-red-500 border border-red-100 flex items-center justify-center rounded-2xl shadow-sm hover:bg-red-50">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Form injection */}
                    {showForm && (
                        <form onSubmit={submitLeaveRequest} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-4 space-y-4">
                            <h3 className="font-bold text-slate-800 text-sm">New Leave Application</h3>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Leave Classification</label>
                                <select required value={leaveForm.type} onChange={e => setLeaveForm({ ...leaveForm, type: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium">
                                    <option value="CASUAL">Casual Leave</option>
                                    <option value="SICK">Sick Leave</option>
                                    <option value="UNPAID">Unpaid Off</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Start</label>
                                    <input required type="date" value={leaveForm.startDate} onChange={e => setLeaveForm({ ...leaveForm, startDate: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">End</label>
                                    <input required type="date" value={leaveForm.endDate} onChange={e => setLeaveForm({ ...leaveForm, endDate: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Reason / Notes</label>
                                <textarea required rows={2} value={leaveForm.reason} onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium resize-none" placeholder="Medical, Personal, etc." />
                            </div>

                            <button type="submit" disabled={submitLoad} className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold text-sm shadow flex items-center justify-center">
                                {submitLoad ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit to HR'}
                            </button>
                        </form>
                    )}

                    {loading ? (
                        <div className="py-10 flex justify-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
                    ) : (
                        <>
                            {/* Absences Block */}
                            <div className="space-y-3">
                                <h2 className="text-sm font-extrabold text-slate-800 tracking-tight pl-1 text-slate-500 uppercase">My Requested Leaves</h2>
                                {leaves.length === 0 ? (
                                    <div className="bg-white border text-center border-slate-200 p-6 rounded-3xl shadow-sm text-slate-400 text-sm">No leave requests found.</div>
                                ) : leaves.map((lv: any) => (
                                    <div key={lv.id} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
                                        <div>
                                            <span className="text-[10px] font-extrabold uppercase bg-slate-100 px-2 py-0.5 rounded text-slate-600 mb-1 inline-block">{lv.type}</span>
                                            <div className="text-sm font-bold text-slate-800">{new Date(lv.startDate).toLocaleDateString()} to {new Date(lv.endDate).toLocaleDateString()}</div>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider border ${lv.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            lv.status === 'REJECTED' ? 'bg-red-50 text-red-600 border-red-100' :
                                                'bg-orange-50 text-orange-600 border-orange-100'
                                            }`}>
                                            {lv.status}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Payslip Block */}
                            {user?.role !== 'VOLUNTEER' && (
                                <div className="space-y-3">
                                    <h2 className="text-sm font-extrabold text-slate-800 tracking-tight pl-1 text-slate-500 uppercase mt-4">Payroll Documents</h2>
                                    {payslips.length === 0 ? (
                                        <div className="bg-white border text-center border-slate-200 p-6 rounded-3xl shadow-sm text-slate-400 text-sm">No documents generated.</div>
                                    ) : payslips.map((ps: any) => (
                                        <div key={ps.id} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-800">Month {ps.month} / {ps.year}</div>
                                                    <div className="text-xs text-slate-500 font-medium">{ps.attendanceDays} Days Logged</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-extrabold text-slate-800">₹{ps.netPay.toLocaleString()}</div>
                                                <button className="text-[10px] text-emerald-600 font-bold uppercase hover:underline">Download</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                </div>

                {/* Floating Nav matching the Dashboard */}
                <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex items-center justify-around px-2 z-[999] shadow-[0_-4px_20px_rgba(0,0,0,0.03)] pb-safe-area">
                    <button onClick={() => window.location.href = '/volunteer/dashboard'} className="flex flex-col items-center flex-1 py-2 text-slate-400">
                        <Briefcase className="w-5 h-5 mb-1" />
                        <span className="text-[10px] font-bold">Zones</span>
                    </button>
                    <div className="flex flex-col items-center flex-1 py-2 text-emerald-600">
                        <div className="w-5 h-5 border-2 border-current rounded-full mb-1 flex items-center justify-center bg-emerald-50">
                            <div className="w-2.5 h-2.5 bg-current rounded-full mr-0.5 mt-0.5"></div>
                        </div>
                        <span className="text-[10px] font-bold">Profile</span>
                    </div>
                </div>

            </div>
        </ProtectedRoute>
    );
}
