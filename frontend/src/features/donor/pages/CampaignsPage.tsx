'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Filter, Sprout, Recycle } from 'lucide-react';
import { useDonorCampaigns } from '../hooks/useDonorQueries';
import { useCampaignFilters } from '../store/useCampaignFilters';
import { CampaignMapPreview } from '../components/CampaignMapPreview';
import { ListSkeleton } from '../components/DonorSkeletons';
import { EmptyState } from '../components/EmptyState';
import { formatCurrency } from '../lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/features/team-leader/components/ui/card';
import { Button } from '@/features/team-leader/components/ui/button';
import { Input } from '@/features/team-leader/components/ui/input';
import { Label } from '@/features/team-leader/components/ui/label';

const PAGE_SIZE = 8;

export function DonorCampaignsPage() {
    const { from, to, location, status, setFrom, setTo, setLocation, setStatus, reset } = useCampaignFilters();
    const [page, setPage] = useState(1);

    useEffect(() => {
        setPage(1);
    }, [from, to, location, status]);

    const filters = useMemo(
        () => ({
            from: from || undefined,
            to: to || undefined,
            location: location || undefined,
            status: status || undefined,
            page,
            limit: PAGE_SIZE,
        }),
        [from, to, location, status, page],
    );

    const { data, isLoading, isError, error, refetch, isFetching } = useDonorCampaigns(filters);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
                <ListSkeleton rows={4} />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="rounded-2xl border border-red-100 bg-red-50/80 p-8 text-center">
                <p className="font-bold text-red-800">Could not load campaigns</p>
                <p className="mt-2 text-sm text-red-700">{error instanceof Error ? error.message : 'Please try again.'}</p>
                <Button type="button" className="mt-4 rounded-xl" onClick={() => void refetch()}>
                    Retry
                </Button>
            </div>
        );
    }

    const rows = data?.data ?? [];
    const total = data?.total ?? 0;
    const hasNext = data?.hasNext ?? false;
    const currentPage = data?.page ?? page;

    return (
        <div className="space-y-8">
            <Card className="border-slate-200/80">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-900">
                        <Filter className="h-5 w-5 text-amber-700" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-2">
                            <Label htmlFor="from">From date</Label>
                            <Input
                                id="from"
                                type="date"
                                value={from}
                                onChange={(e) => setFrom(e.target.value)}
                                className="rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="to">To date</Label>
                            <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="loc">Location</Label>
                            <Input
                                id="loc"
                                placeholder="Zone name"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="st">Status</Label>
                            <select
                                id="st"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-medium"
                            >
                                <option value="">All</option>
                                <option value="ACTIVE">Active</option>
                                <option value="COMPLETED">Completed</option>
                            </select>
                        </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => {
                                reset();
                                setPage(1);
                            }}
                        >
                            Clear
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                <p>
                    <span className="font-bold text-slate-900">{total}</span> campaign{total === 1 ? '' : 's'} total
                    {total > 0 ? (
                        <>
                            {' '}
                            · page <span className="font-bold text-slate-900">{currentPage}</span>
                        </>
                    ) : null}
                    {isFetching ? <span className="ml-2 text-amber-700">Updating…</span> : null}
                </p>
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        disabled={currentPage <= 1 || isFetching}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                        Previous
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        disabled={!hasNext || isFetching}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        Next
                    </Button>
                </div>
            </div>

            {rows.length === 0 ? (
                <EmptyState
                    icon={Sprout}
                    title="No campaigns match"
                    description="Adjust filters or fund a new program — supported campaigns will show here with map previews and impact."
                />
            ) : (
                <div className="grid gap-6 md:grid-cols-2">
                    {rows.map((c, i) => (
                        <motion.div
                            key={c.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                        >
                            <Card className="h-full overflow-hidden border-slate-200/80 shadow-sm transition-shadow hover:shadow-md">
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <CardTitle className="text-lg text-slate-900">{c.title}</CardTitle>
                                        <span
                                            className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                                c.status === 'ACTIVE'
                                                    ? 'bg-emerald-50 text-emerald-800'
                                                    : 'bg-slate-200 text-slate-700'
                                            }`}
                                        >
                                            {c.status === 'ACTIVE' ? 'Active' : 'Completed'}
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium text-slate-500">{c.zoneName}</p>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <CampaignMapPreview lat={c.lat} lng={c.lng} className="h-[160px]" title={c.title} />
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Your contribution</p>
                                            <p className="text-xl font-extrabold text-amber-800">
                                                {formatCurrency(c.contributed, c.currency)}
                                            </p>
                                        </div>
                                        <div className="text-right text-sm text-slate-600">
                                            {typeof c.impact.approvedReportCount === 'number' && c.impact.approvedReportCount > 0 ? (
                                                <p className="text-xs font-medium text-slate-500">
                                                    {c.impact.approvedReportCount} linked report
                                                    {c.impact.approvedReportCount === 1 ? '' : 's'}
                                                </p>
                                            ) : null}
                                            {c.template === 'WASTE_COLLECTION' && c.impact.wasteBagsEstimate != null ? (
                                                <p className="flex items-center justify-end gap-1 font-semibold">
                                                    <Recycle className="h-4 w-4 text-teal-600" />
                                                    ~{c.impact.wasteBagsEstimate} bags est.
                                                </p>
                                            ) : null}
                                            {c.template === 'PLANTATION' && c.impact.treesEstimate != null ? (
                                                <p className="flex items-center justify-end gap-1 font-semibold">
                                                    <Sprout className="h-4 w-4 text-emerald-600" />
                                                    ~{c.impact.treesEstimate} trees est.
                                                </p>
                                            ) : null}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
