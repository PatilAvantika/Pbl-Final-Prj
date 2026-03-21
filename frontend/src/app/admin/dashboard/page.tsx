'use client';

import { useEffect, useState } from 'react';
import MapDynamic from '../../../components/MapDynamic';
import api from '../../../lib/axios';
import { Users, AlertTriangle, TrendingUp, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
    const [stats, setStats] = useState({
        activeTasks: 0,
        volunteersOnField: 0,
        reportsToday: 0,
        issues: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [tasksRes, attendRes, reportsRes] = await Promise.all([
                    api.get('/tasks'),
                    api.get('/attendance/all'),
                    api.get('/reports')
                ]);

                // Simple mock calculations for stats
                const now = new Date();
                const activeTasks = tasksRes.data.filter((t: any) =>
                    new Date(t.startTime) <= now && new Date(t.endTime) >= now
                ).length;

                // Count unique users who clocked in today but no clock out
                const activeVols = new Set(
                    attendRes.data
                        .filter((a: any) => a.type === 'CLOCK_IN')
                        .map((a: any) => a.user.id)
                ).size;

                setStats({
                    activeTasks,
                    volunteersOnField: activeVols,
                    reportsToday: reportsRes.data.length, // Simplified
                    issues: 2 // Mock issue metric
                });

            } catch (err) {
                console.error("Failed to fetch dash stats", err);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Active Field Tasks" value={stats.activeTasks} icon={<TrendingUp className="w-5 h-5 text-sky-500 border" />} trend="+2 Today" color="sky" />
                <StatCard title="Volunteers Assigned" value={stats.volunteersOnField} icon={<Users className="w-5 h-5 text-emerald-500" />} trend="Live Now" color="emerald" />
                <StatCard title="Reports Logged" value={stats.reportsToday} icon={<CheckCircle2 className="w-5 h-5 text-indigo-500" />} trend="14 Pending Approval" color="indigo" />
                <StatCard title="Alerts & Issues" value={stats.issues} icon={<AlertTriangle className="w-5 h-5 text-orange-500" />} trend="Requires Attention" color="orange" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Map Content - spanning 2 columns */}
                <div className="lg:col-span-2 h-[600px] flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Live Geofence Map</h2>
                        <Link href="/admin/tasks" className="text-sm font-bold text-emerald-600 hover:text-emerald-700 hover:underline">Manage Zones →</Link>
                    </div>
                    <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-200 relative">
                        {/* The Map */}
                        <MapDynamic />
                    </div>
                </div>

                {/* Right side panel */}
                <div className="h-[600px] flex flex-col space-y-8">

                    <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">Recent Activity</h2>
                        </div>

                        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                            {/* Mock Timeline */}
                            <TimelineItem title="Volunteer Clock-In" time="Just now" user="John Doe" task="Mumbai Beach Clean" color="emerald" />
                            <TimelineItem title="Field Report Submitted" time="10 mins ago" user="Sarah Silva" task="Dharavi Survey" color="indigo" />
                            <TimelineItem title="Geofence Violated" time="24 mins ago" user="Vikram M" task="Plantation Dr." color="red" />
                            <TimelineItem title="Task Concluded" time="1 hour ago" user="System" task="Waste Collection A" color="sky" />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-lg shadow-emerald-500/20">
                        <h3 className="font-extrabold text-lg flex items-center mb-2">
                            <span className="w-2 h-2 rounded-full bg-white mr-2 animate-pulse"></span>
                            Live Sync Enabled
                        </h3>
                        <p className="text-emerald-50 text-sm font-medium mb-6">The system is actively ingesting location telemetry and offline sync queues from field devices.</p>
                        <button className="w-full bg-white text-emerald-600 hover:bg-emerald-50 font-bold py-2.5 rounded-xl transition-colors">
                            View Logs
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, trend, color }: any) {
    const colorMap: any = {
        sky: 'bg-sky-50 text-sky-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        indigo: 'bg-indigo-50 text-indigo-600',
        orange: 'bg-orange-50 text-orange-600',
    };
    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">{title}</h3>
                <div className={`p-2 rounded-xl ${colorMap[color]}`}>
                    {icon}
                </div>
            </div>
            <div className="text-4xl font-extrabold text-slate-800 tracking-tighter mb-2">{value}</div>
            <div className="text-xs font-bold text-slate-400">{trend}</div>
        </div>
    );
}

function TimelineItem({ title, time, user, task, color }: any) {
    const colorMap: any = {
        emerald: 'bg-emerald-500 shadow-emerald-500/30',
        indigo: 'bg-indigo-500 shadow-indigo-500/30',
        red: 'bg-red-500 shadow-red-500/30',
        sky: 'bg-sky-500 shadow-sky-500/30',
    };

    return (
        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active text-sm">
            {/* Icon */}
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 border-white bg-slate-200 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ${colorMap[color]} text-white absolute left-0 md:left-1/2 z-10`} />

            {/* Content */}
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-1.5rem)] ml-12 md:ml-0 bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                <div className="flex items-center justify-between mb-1">
                    <div className="font-bold text-slate-800">{title}</div>
                    <time className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded shadow-sm border border-slate-100">{time}</time>
                </div>
                <div className="text-slate-500 text-xs font-medium">
                    <span className="text-slate-700 font-bold">{user}</span> • {task}
                </div>
            </div>
        </div>
    );
}
