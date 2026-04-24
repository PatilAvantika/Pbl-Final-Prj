'use client';

import MapDynamic from '../../../components/MapDynamic';
import api from '../../../lib/api/client';
import { Users, AlertTriangle, TrendingUp, CheckCircle2, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useAdminDashboard } from '@/features/admin/hooks/useAdminDashboard';
import { AdminIntelligencePanels } from '@/features/intelligence/components/AdminIntelligencePanels';

function KpiCardSkeleton() {
    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm animate-pulse">
            <div className="flex items-center justify-between mb-4">
                <div className="h-3 w-28 bg-slate-200 rounded" />
                <div className="h-10 w-10 bg-slate-100 rounded-xl" />
            </div>
            <div className="h-10 w-16 bg-slate-200 rounded mb-2" />
            <div className="h-3 w-24 bg-slate-100 rounded" />
        </div>
    );
}

export default function AdminDashboardPage() {
    const [fromDate, setFromDate] = useState(new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10));
    const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));

    const {
        data: dashData,
        isLoading: dashLoading,
        isError: dashError,
        error: dashErr,
    } = useAdminDashboard();

    const { data, isLoading: metricsLoading } = useQuery({
        queryKey: ['admin-dashboard-stats', fromDate, toDate],
        queryFn: async () => {
            const response = await api.get(`/admin/metrics?from=${fromDate}&to=${toDate}`);
            return response.data;
        },
    });

    const kpiActive = dashData?.activeTasks ?? 0;
    const kpiVolunteers = dashData?.volunteersOnField ?? 0;
    const kpiReportsPending = dashData?.reportsPending ?? 0;
    const kpiSync = dashData?.syncFailures ?? 0;

    const stats = data?.kpis || {
        reportsInRange: 0,
        leavePending: 0,
        payslipsInRange: 0,
    };
    const recentActivity = data?.recentActivity || [];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col lg:flex-row gap-3 items-center">
                <div className="flex items-center text-slate-600 font-bold text-sm mr-auto">
                    <Calendar className="w-4 h-4 mr-2" />
                    KPI Date Range
                </div>
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm" />
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm" />
            </div>
            {dashError && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                    KPI snapshot could not be loaded
                    {dashErr && typeof dashErr === 'object' && 'message' in dashErr
                        ? `: ${String((dashErr as Error).message)}`
                        : '.'}{' '}
                    Cards below show placeholders until refresh.
                </div>
            )}

            <AdminIntelligencePanels />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {dashLoading && !dashData ? (
                    <>
                        <KpiCardSkeleton />
                        <KpiCardSkeleton />
                        <KpiCardSkeleton />
                        <KpiCardSkeleton />
                    </>
                ) : (
                    <>
                        <StatCard
                            title="Active Field Tasks"
                            value={dashError ? '—' : kpiActive}
                            icon={<TrendingUp className="w-5 h-5 text-sky-500 border" />}
                            trend="Lifecycle ACTIVE, in time window · Refreshes every 30s"
                            color="sky"
                            href="/admin/tasks"
                        />
                        <StatCard
                            title="Volunteers On Field"
                            value={dashError ? '—' : kpiVolunteers}
                            icon={<Users className="w-5 h-5 text-emerald-500" />}
                            trend="Open clock-in today (UTC) · Refreshes every 30s"
                            color="emerald"
                            href="/admin/hr"
                        />
                        <StatCard
                            title="Reports Pending"
                            value={dashError ? '—' : kpiReportsPending}
                            icon={<CheckCircle2 className="w-5 h-5 text-indigo-500" />}
                            trend={
                                metricsLoading
                                    ? 'Loading range metrics…'
                                    : `${stats.reportsInRange} submitted in selected range`
                            }
                            color="indigo"
                            href="/admin/reports"
                        />
                        <StatCard
                            title="Sync Failures"
                            value={dashError ? '—' : kpiSync}
                            icon={<AlertTriangle className="w-5 h-5 text-orange-500" />}
                            trend="Attendance sync FAILED (24h) · Refreshes every 30s"
                            color="orange"
                            href="/admin/audit"
                        />
                    </>
                )}
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
                            <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">Recent Admin Activity</h2>
                        </div>

                        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                            {recentActivity.length === 0 && (
                                <div className="text-sm text-slate-400">No recent activity in selected range.</div>
                            )}
                            {recentActivity.map((item: any) => (
                                <TimelineItem
                                    key={item.id}
                                    title={String(item.action).replaceAll('_', ' ')}
                                    time={new Date(item.createdAt).toLocaleString()}
                                    user={item.actorName}
                                    task={item.entityType}
                                    color="indigo"
                                />
                            ))}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-lg shadow-emerald-500/20">
                        <h3 className="font-extrabold text-lg flex items-center mb-2">
                            <span className="w-2 h-2 rounded-full bg-white mr-2 animate-pulse"></span>
                            System Health
                        </h3>
                        <p className="text-emerald-50 text-sm font-medium mb-6">
                            Pending Leaves: {metricsLoading ? '…' : stats.leavePending} • Payslips in range:{' '}
                            {metricsLoading ? '…' : stats.payslipsInRange}
                        </p>
                        <Link href="/admin/audit" className="w-full inline-flex items-center justify-center bg-white text-emerald-600 hover:bg-emerald-50 font-bold py-2.5 rounded-xl transition-colors">
                            View Audit Logs
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, trend, color, href }: any) {
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
            <Link href={href} className="text-xs font-bold text-slate-400 hover:text-emerald-600">{trend}</Link>
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
