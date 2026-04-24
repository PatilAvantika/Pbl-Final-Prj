'use client';

import { motion } from 'framer-motion';
import { useMemo, type ElementType } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/features/team-leader/components/ui/card';
import { Skeleton } from '@/features/team-leader/components/ui/skeleton';
import { TaskProgressChart } from '@/features/team-leader/components/charts/TaskProgressChart';
import { AttendanceTrendChart } from '@/features/team-leader/components/charts/AttendanceTrendChart';
import { useTeamLeaderDashboard } from '@/features/team-leader/hooks/use-team-leader-dashboard';
import { useTasks } from '@/features/team-leader/hooks/use-tasks';
import { useAttendance } from '@/features/team-leader/hooks/use-attendance';
import { Users, ListTodo, Clock, FileWarning } from 'lucide-react';

function KpiCard({
    title,
    value,
    hint,
    icon: Icon,
    loading,
}: {
    title: string;
    value: string;
    hint: string;
    icon: ElementType;
    loading?: boolean;
}) {
    return (
        <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="rounded-2xl shadow-sm shadow-black/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                    <Icon className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <Skeleton className="h-8 w-24" />
                    ) : (
                        <p className="text-2xl font-bold tracking-tight">{value}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">{hint}</p>
                </CardContent>
            </Card>
        </motion.div>
    );
}

export function DashboardPage() {
    const dash = useTeamLeaderDashboard();
    const tasks = useTasks();
    const attendance = useAttendance();

    const rosterHint = useMemo(() => {
        const v = dash.data?.totalVolunteers ?? 0;
        return `${v} on assigned tasks`;
    }, [dash.data?.totalVolunteers]);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Dashboard</h1>
                <p className="text-muted-foreground mt-1">Overview of your field tasks, attendance, and report queue.</p>
            </div>
            {(dash.isError || tasks.isError || attendance.isError) && (
                <p className="text-sm text-destructive">
                    Some data failed to load. Refresh or check your connection to the API.
                </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    title="Total tasks"
                    value={String(dash.data?.totalTasks ?? 0)}
                    hint="Tasks you lead or legacy assignments"
                    icon={ListTodo}
                    loading={dash.isLoading}
                />
                <KpiCard
                    title="Active tasks"
                    value={String(dash.data?.activeTasks ?? 0)}
                    hint="Pending + active lifecycle"
                    icon={ListTodo}
                    loading={dash.isLoading}
                />
                <KpiCard
                    title="Reports pending"
                    value={String(dash.data?.reportsPending ?? 0)}
                    hint="Awaiting your review"
                    icon={FileWarning}
                    loading={dash.isLoading}
                />
                <KpiCard
                    title="Attendance today"
                    value={String(dash.data?.attendanceToday ?? 0)}
                    hint={`Events on your tasks · ${rosterHint}`}
                    icon={Clock}
                    loading={dash.isLoading}
                />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                <KpiCard
                    title="Volunteers on roster"
                    value={String(dash.data?.totalVolunteers ?? 0)}
                    hint="Distinct volunteers on your tasks"
                    icon={Users}
                    loading={dash.isLoading}
                />
                <KpiCard
                    title="Reports approved"
                    value={String(dash.data?.reportsApproved ?? 0)}
                    hint={`${dash.data?.reportsSubmitted ?? 0} submitted total`}
                    icon={FileWarning}
                    loading={dash.isLoading}
                />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="rounded-2xl shadow-sm">
                    <CardHeader>
                        <CardTitle>Task progress</CardTitle>
                        <CardDescription>Distribution by status</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {tasks.isLoading ? (
                            <Skeleton className="h-[280px] w-full" />
                        ) : (tasks.data?.length ?? 0) === 0 ? (
                            <p className="text-sm text-muted-foreground flex h-[280px] items-center justify-center">
                                No tasks yet. Create one from Task management.
                            </p>
                        ) : (
                            <TaskProgressChart tasks={tasks.data ?? []} />
                        )}
                    </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-sm">
                    <CardHeader>
                        <CardTitle>Attendance trend</CardTitle>
                        <CardDescription>Verified check-ins (org-wide live feed, 7 days)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {attendance.isLoading ? (
                            <Skeleton className="h-[280px] w-full" />
                        ) : (
                            <AttendanceTrendChart rows={attendance.data ?? []} />
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
