'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/features/team-leader/components/ui/card';
import { Button } from '@/features/team-leader/components/ui/button';
import { Input } from '@/features/team-leader/components/ui/input';
import { Label } from '@/features/team-leader/components/ui/label';
import { Badge } from '@/features/team-leader/components/ui/badge';
import { Skeleton } from '@/features/team-leader/components/ui/skeleton';
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
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/features/team-leader/components/ui/dialog';
import { useTasks } from '@/features/team-leader/hooks/use-tasks';
import {
    useAllocateResource,
    useCreateOrgResource,
    useOrgResources,
    useResourceAllocations,
} from '@/features/team-leader/hooks/use-team-leader-resources';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/features/team-leader/components/ui/table';

export function ResourceManagementPage() {
    const { data: tasks = [], isLoading: tasksLoading } = useTasks();
    const resources = useOrgResources();
    const allocations = useResourceAllocations();
    const allocateMut = useAllocateResource();
    const createMut = useCreateOrgResource();

    const [taskId, setTaskId] = useState<string>('');
    const [resourceId, setResourceId] = useState<string>('');
    const [qty, setQty] = useState<string>('1');
    const [addOpen, setAddOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [newQty, setNewQty] = useState('0');

    const taskOptions = useMemo(() => tasks.map((t) => ({ id: t.id, title: t.title })), [tasks]);

    const inv = resources.data ?? [];
    const allocRows = allocations.data ?? [];

    const qtyNum = Math.trunc(Number(qty));
    const selectedResource = inv.find((r) => r.id === resourceId);
    const canAllocate =
        Boolean(taskId && resourceId && Number.isFinite(qtyNum) && qtyNum >= 1 && selectedResource && selectedResource.quantity >= qtyNum);

    const onAllocate = () => {
        if (!canAllocate) return;
        allocateMut.mutate({ taskId, resourceId, quantity: qtyNum });
    };

    const onCreateResource = () => {
        const name = newName.trim();
        if (!name) return;
        const q = Math.max(0, Math.trunc(Number(newQty) || 0));
        createMut.mutate(
            { name, quantity: q },
            {
                onSuccess: () => {
                    setAddOpen(false);
                    setNewName('');
                    setNewQty('0');
                },
            },
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Resource management</h1>
                    <p className="text-muted-foreground mt-1">
                        Org inventory from the API — allocate stock to your field tasks (deducts on-hand quantity).
                    </p>
                </div>
                <Button type="button" className="rounded-2xl shrink-0" onClick={() => setAddOpen(true)}>
                    Add resource
                </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="rounded-2xl shadow-sm">
                    <CardHeader>
                        <CardTitle>Inventory</CardTitle>
                        <CardDescription>GET /resources — quantities in your organization</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {resources.isError && (
                            <p className="text-sm text-destructive">Could not load resources.</p>
                        )}
                        {resources.isLoading ? (
                            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-2xl" />)
                        ) : inv.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-6 text-center">
                                No resources yet. Add gloves, bags, or tools to track stock.
                            </p>
                        ) : (
                            inv.map((item, i) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: -6 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    className="flex flex-col gap-2 rounded-2xl border p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div>
                                        <p className="font-medium">{item.name}</p>
                                        <p className="text-xs text-muted-foreground">UUID {item.id.slice(0, 8)}…</p>
                                    </div>
                                    <Badge variant="secondary" className="rounded-lg w-fit">
                                        {item.quantity} in stock
                                    </Badge>
                                </motion.div>
                            ))
                        )}
                    </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-sm">
                    <CardHeader>
                        <CardTitle>Allocate to task</CardTitle>
                        <CardDescription>POST /resources/allocate — only tasks you lead</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Task</Label>
                            <Select value={taskId} onValueChange={setTaskId} disabled={tasksLoading}>
                                <SelectTrigger className="rounded-2xl">
                                    <SelectValue placeholder={tasksLoading ? 'Loading tasks…' : 'Select task'} />
                                </SelectTrigger>
                                <SelectContent>
                                    {taskOptions.map((t) => (
                                        <SelectItem key={t.id} value={t.id}>
                                            {t.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Resource</Label>
                            <Select value={resourceId} onValueChange={setResourceId} disabled={resources.isLoading}>
                                <SelectTrigger className="rounded-2xl">
                                    <SelectValue placeholder="Select resource" />
                                </SelectTrigger>
                                <SelectContent>
                                    {inv.map((r) => (
                                        <SelectItem key={r.id} value={r.id}>
                                            {r.name} ({r.quantity} available)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Quantity</Label>
                            <Input
                                type="number"
                                min={1}
                                className="rounded-2xl"
                                value={qty}
                                onChange={(e) => setQty(e.target.value)}
                            />
                        </div>
                        <Button
                            type="button"
                            className="w-full rounded-2xl"
                            disabled={!canAllocate || allocateMut.isPending}
                            onClick={onAllocate}
                        >
                            {allocateMut.isPending ? 'Allocating…' : 'Allocate'}
                        </Button>
                        {resourceId && selectedResource && Number.isFinite(qtyNum) && qtyNum > selectedResource.quantity ? (
                            <p className="text-xs text-destructive">Not enough stock for this quantity.</p>
                        ) : null}
                    </CardContent>
                </Card>
            </div>

            <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                    <CardTitle>Recent allocations</CardTitle>
                    <CardDescription>GET /resources/allocations — your tasks only</CardDescription>
                </CardHeader>
                <CardContent>
                    {allocations.isLoading ? (
                        <Skeleton className="h-40 w-full rounded-2xl" />
                    ) : allocations.isError ? (
                        <p className="text-sm text-destructive">Could not load allocations.</p>
                    ) : allocRows.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-8 text-center">No allocations yet.</p>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Task</TableHead>
                                        <TableHead>Resource</TableHead>
                                        <TableHead className="text-right">Qty</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {allocRows.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell className="font-medium">
                                                {row.task?.title ?? row.taskId.slice(0, 8)}
                                            </TableCell>
                                            <TableCell>{row.resource?.name ?? row.resourceId.slice(0, 8)}</TableCell>
                                            <TableCell className="text-right">{row.quantity}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogContent className="rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Add resource</DialogTitle>
                        <DialogDescription>POST /resources — adds a catalog line and starting quantity.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="space-y-2">
                            <Label htmlFor="res-name">Name</Label>
                            <Input
                                id="res-name"
                                className="rounded-2xl"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="e.g. Nitrile gloves (boxes)"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="res-qty">Initial quantity</Label>
                            <Input
                                id="res-qty"
                                type="number"
                                min={0}
                                className="rounded-2xl"
                                value={newQty}
                                onChange={(e) => setNewQty(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" className="rounded-xl" onClick={() => setAddOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            className="rounded-xl"
                            disabled={!newName.trim() || createMut.isPending}
                            onClick={onCreateResource}
                        >
                            {createMut.isPending ? 'Saving…' : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
