'use client';

import { useMemo } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/features/team-leader/components/ui/card';
import { Skeleton } from '@/features/team-leader/components/ui/skeleton';
import { useTeamLeaderDashboard } from '@/features/team-leader/hooks/use-team-leader-dashboard';
import { useTasks } from '@/features/team-leader/hooks/use-tasks';
import { useReports } from '@/features/team-leader/hooks/use-reports';

const COL = {
    primary: 'hsl(173 58% 39%)',
    muted: 'hsl(215 16% 47%)',
    success: 'hsl(142 76% 36%)',
    warn: 'hsl(38 92% 50%)',
    danger: 'hsl(0 72% 51%)',
};

export function AnalyticsPage() {
    const dash = useTeamLeaderDashboard();
    const tasks = useTasks();
    const reports = useReports();

    const taskBars = useMemo(() => {
        const list = tasks.data ?? [];
        const completed = list.filter((t) => t.status === 'COMPLETED').length;
        const inProg = list.filter((t) => t.status === 'IN_PROGRESS').length;
        const pending = list.filter((t) => t.status === 'PENDING').length;
        return [
            { name: 'Completed', value: completed, fill: COL.success },
            { name: 'In progress', value: inProg, fill: COL.primary },
            { name: 'Pending', value: pending, fill: COL.muted },
        ];
    }, [tasks.data]);

    const reportPie = useMemo(() => {
        const d = dash.data;
        if (!d) return [];
        return [
            { name: 'Approved', value: d.reportsApproved, fill: COL.success },
            { name: 'Pending', value: d.reportsPending, fill: COL.warn },
            { name: 'Rejected', value: d.reportsRejected, fill: COL.danger },
        ].filter((x) => x.value > 0);
    }, [dash.data]);

    const attendanceBar = useMemo(() => {
        const d = dash.data;
        if (!d) return [];
        const denom = Math.max(d.totalVolunteers, 1);
        const rate =
            d.attendanceToday > 0 ? Math.min(100, Math.round((d.attendanceToday / denom) * 100)) : 0;
        return [
            { name: 'Attendance signals today', value: d.attendanceToday, fill: COL.primary },
            { name: 'Estimated coverage %', value: rate, fill: COL.muted },
        ];
    }, [dash.data]);

    const loading = dash.isLoading || tasks.isLoading || reports.isLoading;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Analytics</h1>
                <p className="text-muted-foreground mt-1">Field performance across your tasks, attendance, and reports.</p>
            </div>
            {(dash.isError || tasks.isError || reports.isError) && (
                <p className="text-sm text-destructive">Some analytics data failed to load.</p>
            )}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="rounded-2xl shadow-sm">
                    <CardHeader>
                        <CardTitle>Tasks by status</CardTitle>
                        <CardDescription>Lifecycle distribution for your scoped tasks</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-[280px] w-full rounded-2xl" />
                        ) : (
                            <div className="h-[280px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={taskBars} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '1rem',
                                                border: '1px solid hsl(var(--border))',
                                            }}
                                        />
                                        <Bar dataKey="value" radius={[10, 10, 0, 0]} maxBarSize={56}>
                                            {taskBars.map((e) => (
                                                <Cell key={e.name} fill={e.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-sm">
                    <CardHeader>
                        <CardTitle>Report outcomes</CardTitle>
                        <CardDescription>Approved vs pending vs rejected (dashboard scope)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-[280px] w-full rounded-2xl" />
                        ) : reportPie.length === 0 ? (
                            <p className="text-sm text-muted-foreground flex h-[280px] items-center justify-center">
                                No report outcomes yet.
                            </p>
                        ) : (
                            <div className="h-[280px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={reportPie}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={100}
                                            label
                                        >
                                            {reportPie.map((e) => (
                                                <Cell key={e.name} fill={e.fill} />
                                            ))}
                                        </Pie>
                                        <Legend />
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-sm lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Attendance pulse</CardTitle>
                        <CardDescription>
                            Today&apos;s attendance events on your tasks vs a simple coverage index (volunteers on roster)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-[220px] w-full rounded-2xl" />
                        ) : (
                            <div className="h-[220px] w-full max-w-lg">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={attendanceBar} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Bar dataKey="value" radius={[10, 10, 0, 0]} maxBarSize={64}>
                                            {attendanceBar.map((e) => (
                                                <Cell key={e.name} fill={e.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
