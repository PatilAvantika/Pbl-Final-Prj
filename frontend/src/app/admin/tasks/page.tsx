'use client';

import { useState } from 'react';
import api from '../../../lib/axios';
import { Plus, Search, MapPin, Calendar, Users, Target, ArrowRight, Pencil, Power } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import { hasPermission } from '../../../lib/permissions';

export default function TasksAdminPage() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const canEditTasks = hasPermission(user?.role, 'createOrEditTasks');
    const [search, setSearch] = useState('');
    const [templateFilter, setTemplateFilter] = useState('ALL');
    const [activeFilter, setActiveFilter] = useState('ALL');
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<any | null>(null);
    const [availableUsers, setAvailableUsers] = useState<any[]>([]);
    const [selectedAssignUserIds, setSelectedAssignUserIds] = useState<string[]>([]);
    const [selectedRemoveUserIds, setSelectedRemoveUserIds] = useState<string[]>([]);
    const [formData, setFormData] = useState({
        title: '', template: 'WASTE_COLLECTION', zoneName: '',
        geofenceLat: '', geofenceLng: '', geofenceRadius: 100,
        startTime: '', endTime: ''
    });
    const [editFormData, setEditFormData] = useState({
        id: '',
        title: '', template: 'WASTE_COLLECTION', zoneName: '',
        geofenceLat: '', geofenceLng: '', geofenceRadius: 100,
        startTime: '', endTime: '', isActive: true,
    });

    const { data: tasks = [], isLoading: loading } = useQuery({
        queryKey: ['admin-tasks', search, templateFilter, activeFilter],
        queryFn: async () => {
            const params = new URLSearchParams({ limit: '200' });
            if (search.trim()) params.set('search', search.trim());
            if (templateFilter !== 'ALL') params.set('template', templateFilter);
            if (activeFilter !== 'ALL') params.set('isActive', String(activeFilter === 'ACTIVE'));
            return (await api.get(`/tasks?${params.toString()}`)).data;
        },
    });

    const createTaskMutation = useMutation({
        mutationFn: async (payload: any) => api.post('/tasks', payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-tasks'] });
            setShowModal(false);
            setFormData({ title: '', template: 'WASTE_COLLECTION', zoneName: '', geofenceLat: '', geofenceLng: '', geofenceRadius: 100, startTime: '', endTime: '' });
        },
    });

    const updateTaskMutation = useMutation({
        mutationFn: async ({ id, payload }: { id: string; payload: any }) => api.put(`/tasks/${id}`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-tasks'] });
            setShowEditModal(false);
        },
    });

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createTaskMutation.mutateAsync({
                ...formData,
                geofenceLat: parseFloat(formData.geofenceLat),
                geofenceLng: parseFloat(formData.geofenceLng),
                geofenceRadius: parseFloat(formData.geofenceRadius as any)
            });
        } catch (error) {
            alert("Failed to create task");
        }
    };

    const openEditModal = (task: any) => {
        setEditFormData({
            id: task.id,
            title: task.title || '',
            template: task.template || 'WASTE_COLLECTION',
            zoneName: task.zoneName || '',
            geofenceLat: String(task.geofenceLat ?? ''),
            geofenceLng: String(task.geofenceLng ?? ''),
            geofenceRadius: task.geofenceRadius ?? 100,
            startTime: new Date(task.startTime).toISOString().slice(0, 16),
            endTime: new Date(task.endTime).toISOString().slice(0, 16),
            isActive: !!task.isActive,
        });
        setShowEditModal(true);
    };

    const handleUpdateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateTaskMutation.mutateAsync({
                id: editFormData.id,
                payload: {
                    title: editFormData.title,
                    template: editFormData.template,
                    zoneName: editFormData.zoneName,
                    geofenceLat: parseFloat(editFormData.geofenceLat),
                    geofenceLng: parseFloat(editFormData.geofenceLng),
                    geofenceRadius: Number(editFormData.geofenceRadius),
                    startTime: editFormData.startTime,
                    endTime: editFormData.endTime,
                    isActive: editFormData.isActive,
                },
            });
        } catch (error) {
            alert('Failed to update task');
        }
    };

    const openAssignModal = async (task: any) => {
        try {
            const [taskRes, usersRes] = await Promise.all([
                api.get(`/tasks/${task.id}`),
                api.get('/users?role=VOLUNTEER&limit=200'),
            ]);
            setSelectedTask(taskRes.data);
            setAvailableUsers(usersRes.data || []);
            setSelectedAssignUserIds([]);
            setSelectedRemoveUserIds([]);
            setShowAssignModal(true);
        } catch (error) {
            alert('Failed to load assignment data');
        }
    };

    const handleAssignUser = async (userId: string) => {
        if (!selectedTask) return;
        try {
            await api.post(`/tasks/${selectedTask.id}/assign`, { userId });
            openAssignModal(selectedTask);
            queryClient.invalidateQueries({ queryKey: ['admin-tasks'] });
        } catch (error) {
            alert('Failed to assign user');
        }
    };

    const handleRemoveUser = async (userId: string) => {
        if (!selectedTask) return;
        try {
            await api.delete(`/tasks/${selectedTask.id}/assign/${userId}`);
            openAssignModal(selectedTask);
            queryClient.invalidateQueries({ queryKey: ['admin-tasks'] });
        } catch (error) {
            alert('Failed to remove user');
        }
    };

    const handleBulkAssign = async () => {
        if (!selectedTask || selectedAssignUserIds.length === 0) return;
        try {
            await Promise.all(selectedAssignUserIds.map((userId) => api.post(`/tasks/${selectedTask.id}/assign`, { userId })));
            await openAssignModal(selectedTask);
            queryClient.invalidateQueries({ queryKey: ['admin-tasks'] });
        } catch (error) {
            alert('Failed to assign selected users');
        }
    };

    const handleBulkRemove = async () => {
        if (!selectedTask || selectedRemoveUserIds.length === 0) return;
        try {
            await Promise.all(selectedRemoveUserIds.map((userId) => api.delete(`/tasks/${selectedTask.id}/assign/${userId}`)));
            await openAssignModal(selectedTask);
            queryClient.invalidateQueries({ queryKey: ['admin-tasks'] });
        } catch (error) {
            alert('Failed to remove selected users');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Active Field Operations</h1>
                    <p className="text-slate-500 font-medium">Manage deployment zones, assign volunteers, and track geofences.</p>
                </div>

                {canEditTasks && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg shadow-emerald-500/30 flex items-center transition-all hover:-translate-y-0.5"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Deploy New Task
                    </button>
                )}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col lg:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search title or zone"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium"
                    />
                </div>
                <select
                    value={templateFilter}
                    onChange={(e) => setTemplateFilter(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700"
                >
                    <option value="ALL">All Templates</option>
                    <option value="WASTE_COLLECTION">Waste Collection</option>
                    <option value="PLANTATION">Plantation</option>
                    <option value="AWARENESS">Awareness</option>
                    <option value="SURVEY">Survey</option>
                    <option value="TRAINING">Training</option>
                </select>
                <select
                    value={activeFilter}
                    onChange={(e) => setActiveFilter(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700"
                >
                    <option value="ALL">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                </select>
            </div>

            {loading ? (
                <div className="h-64 flex items-center justify-center border border-slate-200 bg-white rounded-3xl shrink-0"><span className="animate-pulse font-bold text-slate-400">Loading Zones...</span></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tasks.map((task: any) => (
                        <div key={task.id} className="bg-white rounded-3xl border border-slate-200 p-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all flex flex-col items-start text-left">
                            <div className="flex w-full items-start justify-between mb-4">
                                <div className="bg-sky-50 text-sky-600 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md">
                                    {task.template.replace('_', ' ')}
                                </div>
                                <span className={`w-3 h-3 rounded-full shadow-sm ${new Date() >= new Date(task.startTime) && new Date() <= new Date(task.endTime) ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-slate-300'}`}></span>
                            </div>

                            <h3 className="text-lg font-extrabold text-slate-800 tracking-tight leading-tight mb-2">{task.title}</h3>

                            <div className="space-y-2 mt-auto pt-4 w-full">
                                <div className="flex items-center text-sm text-slate-500 font-medium">
                                    <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                                    <span className="truncate">{task.zoneName} (Rad: {task.geofenceRadius}m)</span>
                                </div>
                                <div className="flex items-center text-sm text-slate-500 font-medium">
                                    <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                                    {new Date(task.startTime).toLocaleDateString()}
                                </div>
                                <div className="flex items-center text-sm text-slate-500 font-medium">
                                    <Users className="w-4 h-4 mr-2 text-slate-400" />
                                    {task._count?.assignments || 0} Volunteers Assigned
                                </div>
                            </div>

                            <div className="w-full mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <button onClick={() => openAssignModal(task)} className="text-emerald-600 font-bold text-sm tracking-wide hover:underline focus:outline-none flex items-center group">
                                        Manage Roles
                                        <ArrowRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                    </button>
                                    {canEditTasks && (
                                        <>
                                            <button onClick={() => openEditModal(task)} className="text-sky-600 font-bold text-sm flex items-center">
                                                <Pencil className="w-3.5 h-3.5 mr-1" />
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => updateTaskMutation.mutate({ id: task.id, payload: { isActive: !task.isActive } })}
                                                className={`font-bold text-sm flex items-center ${task.isActive ? 'text-orange-600' : 'text-emerald-600'}`}
                                            >
                                                <Power className="w-3.5 h-3.5 mr-1" />
                                                {task.isActive ? 'Deactivate' : 'Activate'}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Basic Create Task Modal */}
            {showModal && canEditTasks && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center">
                                <Target className="w-5 h-5 mr-2 text-emerald-500" /> Initialize Ops Zone
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold p-2 text-xl leading-none">&times;</button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1 col-span-2 md:col-span-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Task Title</label>
                                    <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium" />
                                </div>
                                <div className="space-y-1 col-span-2 md:col-span-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Template</label>
                                    <select value={formData.template} onChange={e => setFormData({ ...formData, template: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium cursor-pointer">
                                        <option value="WASTE_COLLECTION">Waste Collection</option>
                                        <option value="PLANTATION">Plantation Drive</option>
                                        <option value="AWARENESS">Awareness Campaign</option>
                                        <option value="SURVEY">Field Survey</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Location / Zone Name</label>
                                <input required type="text" value={formData.zoneName} onChange={e => setFormData({ ...formData, zoneName: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium" />
                            </div>

                            <div className="grid grid-cols-3 gap-4 p-4 bg-sky-50/50 rounded-2xl border border-sky-100">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-sky-700 uppercase tracking-wider pl-1">Geofence Lat</label>
                                    <input required type="number" step="any" value={formData.geofenceLat} onChange={e => setFormData({ ...formData, geofenceLat: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-sm font-medium" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-sky-700 uppercase tracking-wider pl-1">Geofence Lng</label>
                                    <input required type="number" step="any" value={formData.geofenceLng} onChange={e => setFormData({ ...formData, geofenceLng: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-sm font-medium" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-sky-700 uppercase tracking-wider pl-1">Radius (meters)</label>
                                    <input required type="number" min="10" value={formData.geofenceRadius} onChange={e => setFormData({ ...formData, geofenceRadius: parseInt(e.target.value) })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-sm font-medium" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Start Time</label>
                                    <input required type="datetime-local" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">End Time</label>
                                    <input required type="datetime-local" value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium" />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end space-x-3">
                                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                                <button type="submit" className="px-5 py-2.5 rounded-xl font-bold text-white bg-slate-800 hover:bg-slate-900 transition-all shadow-lg hover:-translate-y-0.5">Deploy Task</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showEditModal && canEditTasks && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Edit Task</h2>
                            <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 font-bold p-2 text-xl leading-none">&times;</button>
                        </div>
                        <form onSubmit={handleUpdateTask} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input required type="text" value={editFormData.title} onChange={e => setEditFormData({ ...editFormData, title: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium" />
                                <select value={editFormData.template} onChange={e => setEditFormData({ ...editFormData, template: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium">
                                    <option value="WASTE_COLLECTION">Waste Collection</option>
                                    <option value="PLANTATION">Plantation Drive</option>
                                    <option value="AWARENESS">Awareness Campaign</option>
                                    <option value="SURVEY">Field Survey</option>
                                    <option value="TRAINING">Training</option>
                                </select>
                            </div>
                            <input required type="text" value={editFormData.zoneName} onChange={e => setEditFormData({ ...editFormData, zoneName: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium" />
                            <div className="grid grid-cols-3 gap-4">
                                <input required type="number" step="any" value={editFormData.geofenceLat} onChange={e => setEditFormData({ ...editFormData, geofenceLat: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 text-sm font-medium" />
                                <input required type="number" step="any" value={editFormData.geofenceLng} onChange={e => setEditFormData({ ...editFormData, geofenceLng: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 text-sm font-medium" />
                                <input required type="number" min="10" value={editFormData.geofenceRadius} onChange={e => setEditFormData({ ...editFormData, geofenceRadius: parseInt(e.target.value) })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 text-sm font-medium" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input required type="datetime-local" value={editFormData.startTime} onChange={e => setEditFormData({ ...editFormData, startTime: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium" />
                                <input required type="datetime-local" value={editFormData.endTime} onChange={e => setEditFormData({ ...editFormData, endTime: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium" />
                            </div>
                            <select value={editFormData.isActive ? 'true' : 'false'} onChange={e => setEditFormData({ ...editFormData, isActive: e.target.value === 'true' })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium">
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </select>
                            <div className="pt-4 flex justify-end space-x-3">
                                <button type="button" onClick={() => setShowEditModal(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                                <button type="submit" className="px-5 py-2.5 rounded-xl font-bold text-white bg-slate-800 hover:bg-slate-900 transition-all shadow-lg hover:-translate-y-0.5">Save Task</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAssignModal && selectedTask && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Manage Task Assignments</h2>
                            <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xl leading-none">&times;</button>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-bold text-slate-800 mb-3">Assigned Volunteers</h3>
                                <div className="mb-2">
                                    <button onClick={handleBulkRemove} className="text-xs font-bold text-red-600 hover:underline">
                                        Remove Selected ({selectedRemoveUserIds.length})
                                    </button>
                                </div>
                                <div className="space-y-2 max-h-80 overflow-y-auto">
                                    {selectedTask.assignments?.length ? selectedTask.assignments.map((assignment: any) => (
                                        <div key={assignment.user.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-xl">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRemoveUserIds.includes(assignment.user.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedRemoveUserIds((prev) => [...prev, assignment.user.id]);
                                                        } else {
                                                            setSelectedRemoveUserIds((prev) => prev.filter((id) => id !== assignment.user.id));
                                                        }
                                                    }}
                                                />
                                                <div>
                                                <p className="font-semibold text-slate-800">{assignment.user.firstName} {assignment.user.lastName}</p>
                                                <p className="text-xs text-slate-500">{assignment.user.role.replace('_', ' ')}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => handleRemoveUser(assignment.user.id)} className="text-red-500 text-xs font-bold hover:text-red-700">
                                                Remove
                                            </button>
                                        </div>
                                    )) : <p className="text-sm text-slate-400">No assigned users yet.</p>}
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 mb-3">Available Volunteers</h3>
                                <div className="mb-2">
                                    <button onClick={handleBulkAssign} className="text-xs font-bold text-emerald-600 hover:underline">
                                        Assign Selected ({selectedAssignUserIds.length})
                                    </button>
                                </div>
                                <div className="space-y-2 max-h-80 overflow-y-auto">
                                    {availableUsers.length ? availableUsers.map((user: any) => {
                                        const alreadyAssigned = selectedTask.assignments?.some((a: any) => a.user.id === user.id);
                                        return (
                                            <div key={user.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-xl">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        disabled={alreadyAssigned}
                                                        checked={selectedAssignUserIds.includes(user.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedAssignUserIds((prev) => [...prev, user.id]);
                                                            } else {
                                                                setSelectedAssignUserIds((prev) => prev.filter((id) => id !== user.id));
                                                            }
                                                        }}
                                                    />
                                                    <div>
                                                    <p className="font-semibold text-slate-800">{user.firstName} {user.lastName}</p>
                                                    <p className="text-xs text-slate-500">{user.email}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    disabled={alreadyAssigned}
                                                    onClick={() => handleAssignUser(user.id)}
                                                    className="text-emerald-600 text-xs font-bold hover:text-emerald-800 disabled:text-slate-400"
                                                >
                                                    {alreadyAssigned ? 'Assigned' : 'Assign'}
                                                </button>
                                            </div>
                                        );
                                    }) : <p className="text-sm text-slate-400">No users available.</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
