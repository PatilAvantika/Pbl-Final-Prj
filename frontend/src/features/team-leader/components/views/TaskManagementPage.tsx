'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/features/team-leader/components/ui/card';
import { Label } from '@/features/team-leader/components/ui/label';
import { Input } from '@/features/team-leader/components/ui/input';
import { Textarea } from '@/features/team-leader/components/ui/textarea';
import { Button } from '@/features/team-leader/components/ui/button';
import { Switch } from '@/features/team-leader/components/ui/switch';
import { Badge } from '@/features/team-leader/components/ui/badge';
import { Skeleton } from '@/features/team-leader/components/ui/skeleton';
import { MapPicker } from '@/features/team-leader/components/map/MapPicker';
import { useTasks, useCreateTask, useBulkAssignTask, useUpdateTaskStatus } from '@/features/team-leader/hooks/use-tasks';
import { useTeam } from '@/features/team-leader/hooks/use-team';
import type { Task, TaskStatus } from '@/features/team-leader/types/team-leader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/features/team-leader/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/features/team-leader/components/ui/dialog';

const statuses: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];

function statusLabel(s: TaskStatus) {
  if (s === 'IN_PROGRESS') return 'In progress';
  return s.charAt(0) + s.slice(1).toLowerCase();
}

export function TaskManagementPage() {
  const { data: tasks = [], isLoading } = useTasks();
  const { data: volunteers = [] } = useTeam();
  const createMut = useCreateTask();
  const bulkMut = useBulkAssignTask();
  const statusMut = useUpdateTaskStatus();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [resources, setResources] = useState('');
  const [openTask, setOpenTask] = useState(true);
  const [lat, setLat] = useState<number | undefined>(19.076);
  const [lng, setLng] = useState<number | undefined>(72.8777);
  const [selectedVolunteers, setSelectedVolunteers] = useState<Set<string>>(new Set());
  const [assignTaskId, setAssignTaskId] = useState<string | null>(null);

  const toggleVolunteer = (id: string) => {
    setSelectedVolunteers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    createMut.mutate({
      title,
      description,
      deadline: deadline || undefined,
      latitude: lat,
      longitude: lng,
      locationLabel: lat && lng ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : undefined,
      requiredResources: resources
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      open: openTask,
      assigneeIds: [...selectedVolunteers],
    });
    setTitle('');
    setDescription('');
    setDeadline('');
    setResources('');
    setSelectedVolunteers(new Set());
  };

  const grouped = useMemo(() => {
    const g: Record<TaskStatus, Task[]> = { PENDING: [], IN_PROGRESS: [], COMPLETED: [] };
    for (const t of tasks) {
      if (g[t.status]) g[t.status].push(t);
    }
    return g;
  }, [tasks]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Task management</h1>
        <p className="text-muted-foreground mt-1">Create tasks, assign volunteers, and track status.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>Create task</CardTitle>
            <CardDescription>Creates a field task and sets you as team leader; optional volunteer assignees.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  required
                  className="rounded-2xl"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description</Label>
                <Textarea
                  id="desc"
                  className="rounded-2xl"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <MapPicker
                  latitude={lat}
                  longitude={lng}
                  onLocationChange={(la, ln) => {
                    setLat(la);
                    setLng(ln);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  className="rounded-2xl"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="res">Required resources (comma-separated)</Label>
                <Input
                  id="res"
                  className="rounded-2xl"
                  placeholder="gloves, bags, tools"
                  value={resources}
                  onChange={(e) => setResources(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between rounded-2xl border p-4">
                <div>
                  <p className="font-medium">Open task</p>
                  <p className="text-xs text-muted-foreground">Allow self-serve pickup by volunteers</p>
                </div>
                <Switch checked={openTask} onCheckedChange={setOpenTask} />
              </div>
              <div className="space-y-2">
                <Label>Bulk assign volunteers</Label>
                <div className="max-h-40 space-y-2 overflow-y-auto rounded-2xl border p-3">
                  {volunteers.length === 0 && (
                    <p className="text-xs text-muted-foreground">Load team from GET /team to list volunteers.</p>
                  )}
                  {volunteers.map((v) => (
                    <label key={v.id} className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="rounded border-input"
                        checked={selectedVolunteers.has(v.id)}
                        onChange={() => toggleVolunteer(v.id)}
                      />
                      <span>{v.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full rounded-2xl" disabled={createMut.isPending}>
                {createMut.isPending ? 'Creating…' : 'Create task'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>Task list</CardTitle>
            <CardDescription>GET /tasks/team-leader — attendance &amp; report counts per task.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading && <Skeleton className="h-40 w-full rounded-2xl" />}
            {statuses.map((st) => (
              <div key={st}>
                <h3 className="mb-2 text-sm font-semibold text-muted-foreground">{statusLabel(st)}</h3>
                <div className="space-y-2">
                  {grouped[st].map((t, i) => (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="rounded-2xl border bg-card/60 p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="font-medium">{t.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            <Badge variant="outline" className="rounded-lg text-[10px]">
                              {t.open !== false ? 'Open' : 'Closed'}
                            </Badge>
                            {(t.assigneeIds ?? []).length > 0 && (
                              <Badge variant="secondary" className="rounded-lg text-[10px]">
                                {t.assigneeIds!.length} assigned
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Select
                            value={t.status}
                            onValueChange={(v) => statusMut.mutate({ id: t.id, status: v as TaskStatus })}
                          >
                            <SelectTrigger className="h-9 w-[140px] rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {statuses.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {statusLabel(s)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                            onClick={() => setAssignTaskId(t.id)}
                          >
                            Assign
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {grouped[st].length === 0 && (
                    <p className="text-xs text-muted-foreground py-2">No tasks in this column.</p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {assignTaskId && (
        <BulkAssignDialog
          taskId={assignTaskId}
          volunteers={volunteers}
          onClose={() => setAssignTaskId(null)}
          onSave={(ids) => {
            bulkMut.mutate({ id: assignTaskId, assigneeIds: ids });
            setAssignTaskId(null);
          }}
        />
      )}
    </div>
  );
}

function BulkAssignDialog({
  taskId,
  volunteers,
  onClose,
  onSave,
}: {
  taskId: string;
  volunteers: { id: string; name: string }[];
  onClose: () => void;
  onSave: (ids: string[]) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Bulk assign</DialogTitle>
          <DialogDescription>Task {taskId} — PATCH /tasks/:id (bulk assign volunteers)</DialogDescription>
        </DialogHeader>
        <div className="max-h-48 space-y-2 overflow-y-auto">
          {volunteers.map((v) => (
            <label key={v.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedIds.has(v.id)}
                onChange={() =>
                  setSelectedIds((prev) => {
                    const n = new Set(prev);
                    if (n.has(v.id)) n.delete(v.id);
                    else n.add(v.id);
                    return n;
                  })
                }
              />
              {v.name}
            </label>
          ))}
        </div>
        <Button className="w-full rounded-2xl" onClick={() => onSave([...selectedIds])}>
          Save assignments
        </Button>
      </DialogContent>
    </Dialog>
  );
}
