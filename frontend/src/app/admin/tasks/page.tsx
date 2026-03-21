'use client';

import { useState, useEffect } from 'react';
import api from '../../../lib/axios';
import { Plus, Search, MapPin, Calendar, Users, Target, ArrowRight } from 'lucide-react';

export default function TasksAdminPage() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        title: '', template: 'WASTE_COLLECTION', zoneName: '',
        geofenceLat: '', geofenceLng: '', geofenceRadius: 100,
        startTime: '', endTime: ''
    });

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const res = await api.get('/tasks');
            setTasks(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/tasks', {
                ...formData,
                geofenceLat: parseFloat(formData.geofenceLat),
                geofenceLng: parseFloat(formData.geofenceLng),
                geofenceRadius: parseFloat(formData.geofenceRadius as any)
            });
            setShowModal(false);
            fetchTasks();
            // Reset form
            setFormData({ title: '', template: 'WASTE_COLLECTION', zoneName: '', geofenceLat: '', geofenceLng: '', geofenceRadius: 100, startTime: '', endTime: '' });
        } catch (error) {
            alert("Failed to create task");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Active Field Operations</h1>
                    <p className="text-slate-500 font-medium">Manage deployment zones, assign volunteers, and track geofences.</p>
                </div>

                <button
                    onClick={() => setShowModal(true)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg shadow-emerald-500/30 flex items-center transition-all hover:-translate-y-0.5"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Deploy New Task
                </button>
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
                                <button className="text-emerald-600 font-bold text-sm tracking-wide hover:underline focus:outline-none flex items-center group">
                                    Manage Roles
                                    <ArrowRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Basic Create Task Modal */}
            {showModal && (
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
        </div>
    );
}
