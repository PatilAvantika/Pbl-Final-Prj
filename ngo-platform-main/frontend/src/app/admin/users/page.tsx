'use client';

import { useState } from 'react';
import api from '../../../lib/axios';
import { Shield, Mail, CheckCircle, Edit, XCircle, Plus, Search } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import { hasPermission } from '../../../lib/permissions';

export default function AdminUsersPage() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const canManageUsers = hasPermission(user?.role, 'manageUsers');
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [editingUser, setEditingUser] = useState<any | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editForm, setEditForm] = useState({ firstName: '', lastName: '', role: 'VOLUNTEER', isActive: true });
    const [createForm, setCreateForm] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'VOLUNTEER',
        isActive: true,
    });
    const { data: users = [], isLoading: loading } = useQuery({
        queryKey: ['admin-users', search, roleFilter, statusFilter],
        queryFn: async () => {
            const params = new URLSearchParams({ limit: '200' });
            if (search.trim()) params.set('search', search.trim());
            if (roleFilter !== 'ALL') params.set('role', roleFilter);
            if (statusFilter !== 'ALL') params.set('isActive', String(statusFilter === 'ACTIVE'));
            return (await api.get(`/users?${params.toString()}`)).data;
        },
    });

    const createUserMutation = useMutation({
        mutationFn: async (payload: typeof createForm) => api.post('/users', payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            setShowCreateModal(false);
            setCreateForm({
                email: '',
                password: '',
                firstName: '',
                lastName: '',
                role: 'VOLUNTEER',
                isActive: true,
            });
        },
    });

    const updateUserMutation = useMutation({
        mutationFn: async ({ id, payload }: { id: string; payload: typeof editForm }) => api.put(`/users/${id}`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            setEditingUser(null);
        },
    });

    const openEditModal = (user: any) => {
        setEditingUser(user);
        setEditForm({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            role: user.role || 'VOLUNTEER',
            isActive: !!user.isActive,
        });
    };

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        try {
            await updateUserMutation.mutateAsync({ id: editingUser.id, payload: editForm });
        } catch (err) {
            console.error(err);
            alert('Failed to update user');
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createUserMutation.mutateAsync(createForm);
        } catch (err) {
            console.error(err);
            alert('Failed to create user');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">User Directory</h1>
                    <p className="text-slate-500 font-medium">Manage platform access, active volunteers, and staff privileges.</p>
                </div>
                {canManageUsers && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg shadow-emerald-500/30 flex items-center transition-all hover:-translate-y-0.5"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Create User
                    </button>
                )}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col lg:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name or email"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700"
                >
                    <option value="ALL">All Roles</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="NGO_ADMIN">NGO Admin</option>
                    <option value="FIELD_COORDINATOR">Field Coordinator</option>
                    <option value="HR_MANAGER">HR Manager</option>
                    <option value="FINANCE_MANAGER">Finance Manager</option>
                    <option value="TEAM_LEADER">Team Leader</option>
                    <option value="VOLUNTEER">Volunteer</option>
                    <option value="STAFF">Staff</option>
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700"
                >
                    <option value="ALL">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                </select>
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
                                            {canManageUsers && (
                                                <button
                                                    onClick={() => openEditModal(u)}
                                                    className="text-emerald-600 hover:text-emerald-700 font-bold text-xs px-3 py-1.5 rounded bg-emerald-50 transition-colors inline-flex items-center"
                                                >
                                                    <Edit className="w-3.5 h-3.5 mr-1" />
                                                    Edit User
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {editingUser && canManageUsers && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Edit User</h2>
                            <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600 p-1">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveUser} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">First Name</label>
                                    <input
                                        value={editForm.firstName}
                                        onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Last Name</label>
                                    <input
                                        value={editForm.lastName}
                                        onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Role</label>
                                    <select
                                        value={editForm.role}
                                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                                    >
                                        <option value="VOLUNTEER">Volunteer</option>
                                        <option value="STAFF">Staff</option>
                                        <option value="TEAM_LEADER">Team Leader</option>
                                        <option value="FIELD_COORDINATOR">Field Coordinator</option>
                                        <option value="HR_MANAGER">HR Manager</option>
                                        <option value="FINANCE_MANAGER">Finance Manager</option>
                                        <option value="NGO_ADMIN">NGO Admin</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
                                    <select
                                        value={editForm.isActive ? 'true' : 'false'}
                                        onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === 'true' })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                                    >
                                        <option value="true">Active</option>
                                        <option value="false">Suspended</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100">
                                    Cancel
                                </button>
                                <button type="submit" className="px-5 py-2 rounded-xl font-bold text-white bg-slate-800 hover:bg-slate-900">
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showCreateModal && canManageUsers && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Create User</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    value={createForm.firstName}
                                    onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                                    placeholder="First name"
                                    required
                                />
                                <input
                                    value={createForm.lastName}
                                    onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                                    placeholder="Last name"
                                    required
                                />
                            </div>
                            <input
                                type="email"
                                value={createForm.email}
                                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                                placeholder="Email"
                                required
                            />
                            <input
                                type="password"
                                value={createForm.password}
                                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                                placeholder="Temporary password"
                                minLength={8}
                                required
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <select
                                    value={createForm.role}
                                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                                >
                                    <option value="VOLUNTEER">Volunteer</option>
                                    <option value="STAFF">Staff</option>
                                    <option value="TEAM_LEADER">Team Leader</option>
                                    <option value="FIELD_COORDINATOR">Field Coordinator</option>
                                    <option value="HR_MANAGER">HR Manager</option>
                                    <option value="FINANCE_MANAGER">Finance Manager</option>
                                    <option value="NGO_ADMIN">NGO Admin</option>
                                </select>
                                <select
                                    value={createForm.isActive ? 'true' : 'false'}
                                    onChange={(e) => setCreateForm({ ...createForm, isActive: e.target.value === 'true' })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                                >
                                    <option value="true">Active</option>
                                    <option value="false">Suspended</option>
                                </select>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100">
                                    Cancel
                                </button>
                                <button type="submit" className="px-5 py-2 rounded-xl font-bold text-white bg-slate-800 hover:bg-slate-900">
                                    Create User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
