'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/features/team-leader/components/ui/card';
import { Badge } from '@/features/team-leader/components/ui/badge';
import { Button } from '@/features/team-leader/components/ui/button';
import { Skeleton } from '@/features/team-leader/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/features/team-leader/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/features/team-leader/components/ui/dialog';
import { Label } from '@/features/team-leader/components/ui/label';
import { Textarea } from '@/features/team-leader/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/features/team-leader/components/ui/select';
import { useAttendance, useOverrideAttendance, useTaskAttendance } from '@/features/team-leader/hooks/use-attendance';
import { useTasks } from '@/features/team-leader/hooks/use-tasks';
import type { AttendanceRow } from '@/features/team-leader/types/team-leader';

function statusBadge(status: 'PRESENT' | 'NOT_CHECKED_IN' | 'CHECKED_OUT') {
    if (status === 'PRESENT') return <Badge className="rounded-lg bg-emerald-600">Present</Badge>;
    if (status === 'NOT_CHECKED_IN') return <Badge variant="secondary" className="rounded-lg">Not checked in</Badge>;
    return <Badge variant="outline" className="rounded-lg">Checked out</Badge>;
}

export function AttendancePage() {
    const { data: tasks = [], isLoading: tasksLoading } = useTasks();
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const taskRows = useTaskAttendance(selectedTaskId);
    const { data: liveRows = [], isLoading: liveLoading, isError: liveError } = useAttendance();
    const overrideMut = useOverrideAttendance();
    const [modalRow, setModalRow] = useState<AttendanceRow | null>(null);
    const [reason, setReason] = useState('');
    const [action, setAction] = useState<'APPROVE' | 'REJECT' | 'CORRECT'>('CORRECT');

    useEffect(() => {
        if (!selectedTaskId && tasks.length > 0) {
            setSelectedTaskId(tasks[0].id);
        }
    }, [tasks, selectedTaskId]);

    const suspicious = (r: AttendanceRow) => r.suspicious || !r.gpsOk || (r.faceMatchScore ?? 0) < 0.7;

    const submitOverride = () => {
        if (!modalRow || !reason.trim()) return;
        overrideMut.mutate(
            { attendanceId: modalRow.id, reason: reason.trim(), action },
            {
                onSuccess: () => {
                    setModalRow(null);
                    setReason('');
                },
            },
        );
    };

    const selectedTitle = tasks.find((t) => t.id === selectedTaskId)?.title ?? 'Task';

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Attendance</h1>
                <p className="text-muted-foreground mt-1">
                    Live roster per task (GET /attendance/task/:taskId) plus org-wide recent clock-ins.
                </p>
            </div>

            <Card className="rounded-2xl shadow-sm">
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <CardTitle>Attendance by task</CardTitle>
                        <CardDescription>Assigned volunteers and today&apos;s clock-in/out</CardDescription>
                    </div>
                    <div className="w-full sm:w-72">
                        <Label className="sr-only">Task</Label>
                        <Select
                            value={selectedTaskId ?? ''}
                            onValueChange={(v) => setSelectedTaskId(v)}
                            disabled={tasksLoading || tasks.length === 0}
                        >
                            <SelectTrigger className="rounded-2xl">
                                <SelectValue placeholder="Select a task" />
                            </SelectTrigger>
                            <SelectContent>
                                {tasks.map((t) => (
                                    <SelectItem key={t.id} value={t.id}>
                                        {t.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    {tasksLoading ? (
                        <Skeleton className="h-48 w-full rounded-2xl" />
                    ) : tasks.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-8 text-center">No tasks to monitor yet.</p>
                    ) : taskRows.isLoading ? (
                        <Skeleton className="h-48 w-full rounded-2xl" />
                    ) : taskRows.isError ? (
                        <p className="text-sm text-destructive">Could not load attendance for this task.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Volunteer</TableHead>
                                    <TableHead>Clock in</TableHead>
                                    <TableHead>Clock out</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(taskRows.data ?? []).map((r) => (
                                    <TableRow key={r.userId}>
                                        <TableCell className="font-medium">{r.name}</TableCell>
                                        <TableCell className="text-muted-foreground text-xs">
                                            {r.clockInAt ? new Date(r.clockInAt).toLocaleString() : '—'}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-xs">
                                            {r.clockOutAt ? new Date(r.clockOutAt).toLocaleString() : '—'}
                                        </TableCell>
                                        <TableCell>{statusBadge(r.status)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                    {!taskRows.isLoading && (taskRows.data?.length ?? 0) === 0 && selectedTaskId && !taskRows.isError && (
                        <p className="text-sm text-muted-foreground py-6 text-center">
                            No volunteers assigned to {selectedTitle}.
                        </p>
                    )}
                </CardContent>
            </Card>

            {liveError && <p className="text-sm text-destructive">GET /attendance/team-live failed.</p>}
            <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                    <CardTitle>Recent org clock-ins</CardTitle>
                    <CardDescription>Latest check-ins across the organization — POST /attendance/override</CardDescription>
                </CardHeader>
                <CardContent>
                    {liveLoading ? (
                        <Skeleton className="h-64 w-full rounded-2xl" />
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Check-in</TableHead>
                                    <TableHead>GPS</TableHead>
                                    <TableHead>Face</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {liveRows.map((r) => (
                                    <TableRow
                                        key={r.id}
                                        className={
                                            suspicious(r)
                                                ? 'bg-amber-50/80 animate-fade-in dark:bg-amber-950/20'
                                                : 'animate-fade-in'
                                        }
                                        data-state={suspicious(r) ? 'selected' : undefined}
                                    >
                                        <TableCell className="font-medium">{r.name}</TableCell>
                                        <TableCell className="text-muted-foreground text-xs">
                                            {new Date(r.checkInAt).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={r.gpsOk ? 'success' : 'warning'} className="rounded-lg">
                                                {r.gpsOk ? 'OK' : 'Off'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={(r.faceMatchScore ?? 0) >= 0.7 ? 'success' : 'warning'} className="rounded-lg">
                                                {(r.faceMatchScore ?? 0) >= 0.7 ? 'Verified' : 'Pending'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="rounded-xl"
                                                onClick={() => setModalRow(r)}
                                            >
                                                Override
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                    {!liveLoading && liveRows.length === 0 && (
                        <p className="text-sm text-muted-foreground py-6 text-center">No recent clock-ins.</p>
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!modalRow} onOpenChange={() => setModalRow(null)}>
                <DialogContent className="rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Override attendance</DialogTitle>
                        <DialogDescription>
                            {modalRow?.name} — document the reason for audit.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="space-y-2">
                            <Label>Action</Label>
                            <Select value={action} onValueChange={(v) => setAction(v as typeof action)}>
                                <SelectTrigger className="rounded-2xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CORRECT">Correct / adjust</SelectItem>
                                    <SelectItem value="APPROVE">Force approve</SelectItem>
                                    <SelectItem value="REJECT">Reject check-in</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="reason">Reason</Label>
                            <Textarea
                                id="reason"
                                className="rounded-2xl"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Required for compliance..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="rounded-xl" onClick={() => setModalRow(null)}>
                            Cancel
                        </Button>
                        <Button
                            className="rounded-xl"
                            disabled={!reason.trim() || overrideMut.isPending}
                            onClick={submitOverride}
                        >
                            Submit override
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
