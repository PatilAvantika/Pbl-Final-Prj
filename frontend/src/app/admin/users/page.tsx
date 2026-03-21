'use client';

import { useState, useEffect } from 'react';
import api from '../../../lib/axios';
import { Shield, Mail, CheckCircle, Search, UserCheck } from 'lucide-react';

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await api.get('/users');
            setUsers(res.data);
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
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">User Directory</h1>
                    <p className="text-slate-500 font-medium">Manage platform access, active volunteers, and staff privileges.</p>
                </div>
            </div>

            {loading ? (
                <div className="h-64 flex items-center justify-center bg-white rounded-3xl border border-slate-200">
                    <span className="animate-pulse font-bold text-slate-400">Syncing Identity Engine...</span>
                </div>
            ) : (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                                    <th className="px-6 py-4 border-b border-slate-200">Identity</th>
                                    <th className="px-6 py-4 border-b border-slate-200">System Role</th>
                                    <th className="px-6 py-4 border-b border-slate-200">Status</th>
                                    <th className="px-6 py-4 border-b border-slate-200">Joined Date</th>
                                    <th className="px-6 py-4 border-b border-slate-200 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm font-medium">
                                {users.map((u: any) => (
                                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm uppercase shrink-0">
                                                    {u.firstName?.[0]}{u.lastName?.[0]}
                                                </div>
                                                <div>
                                                    <p className="text-slate-800 font-bold">{u.firstName} {u.lastName}</p>
                                                    <p className="text-slate-500 flex items-center text-xs mt-0.5"><Mail className="w-3 h-3 mr-1" /> {u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-widest ${u.role === 'SUPER_ADMIN' ? 'bg-red-50 text-red-600 border border-red-100' :
                                                    u.role === 'VOLUNTEER' ? 'bg-sky-50 text-sky-600 border border-sky-100' :
                                                        'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                }`}>
                                                <Shield className="w-3 h-3 inline mr-1 -mt-0.5" />
                                                {u.role.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {u.isActive ? (
                                                <span className="flex items-center text-emerald-500 text-xs font-bold"><CheckCircle className="w-4 h-4 mr-1" /> Active</span>
                                            ) : (
                                                <span className="flex items-center text-slate-400 text-xs font-bold">Suspended</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {new Date(u.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-emerald-600 hover:text-emerald-700 font-bold text-xs px-3 py-1.5 rounded bg-emerald-50 transition-colors">
                                                Edit User
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
