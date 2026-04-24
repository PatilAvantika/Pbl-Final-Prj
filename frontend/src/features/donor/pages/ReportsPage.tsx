'use client';

import { useState } from 'react';
import { FileText } from 'lucide-react';
import { useDonorReports } from '../hooks/useDonorQueries';
import { ReportGalleryCard } from '../components/ReportGalleryCard';
import { ReportDetailDialog } from '../components/ReportDetailDialog';
import { ListSkeleton } from '../components/DonorSkeletons';
import { EmptyState } from '../components/EmptyState';
import type { DonorReportRow } from '../types';
import { Button } from '@/features/team-leader/components/ui/button';
import { downloadDonorReportPdf } from '../services/donor-api';
import { toast } from 'sonner';

const PAGE_SIZE = 10;

export function DonorReportsPage() {
    const [page, setPage] = useState(1);
    const { data, isLoading, isError, error, refetch, isFetching } = useDonorReports({ page, limit: PAGE_SIZE });
    const [active, setActive] = useState<DonorReportRow | null>(null);
    const [open, setOpen] = useState(false);

    const onView = (r: DonorReportRow) => {
        setActive(r);
        setOpen(true);
    };

    const handleDownload = async (r: DonorReportRow) => {
        try {
            await downloadDonorReportPdf(r.id);
            toast.success('PDF downloaded');
        } catch {
            toast.error('Could not download PDF. The report may be unavailable.');
        }
    };

    if (isLoading && !data) {
        return <ListSkeleton rows={5} />;
    }

    if (isError) {
        return (
            <div className="rounded-2xl border border-red-100 bg-red-50/80 p-8 text-center">
                <p className="font-bold text-red-800">Could not load reports</p>
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

    if (!isLoading && total === 0) {
        return (
            <EmptyState
                icon={FileText}
                title="No verified reports yet"
                description="Once team leaders approve field reports and link them to campaigns you fund, before/after evidence and impact metrics appear here."
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-100 bg-amber-50/60 px-5 py-4">
                <p className="text-sm font-semibold text-amber-950">
                    Reports are visible only when explicitly linked to a campaign you fund and approved by field leadership.
                </p>
                <Button type="button" variant="outline" className="rounded-xl border-amber-200" onClick={() => void refetch()}>
                    {isFetching ? 'Refreshing…' : 'Refresh'}
                </Button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                <p>
                    Showing <span className="font-bold text-slate-900">{rows.length}</span> of{' '}
                    <span className="font-bold text-slate-900">{total}</span> reports
                    {total > 0 ? (
                        <>
                            {' '}
                            (page <span className="font-bold text-slate-900">{currentPage}</span>)
                        </>
                    ) : null}
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

            <div className="space-y-6">
                {rows.map((r, i) => (
                    <ReportGalleryCard
                        key={r.id}
                        report={r}
                        onView={() => onView(r)}
                        delay={Math.min(i * 0.04, 0.3)}
                        onDownload={() => void handleDownload(r)}
                    />
                ))}
            </div>

            <ReportDetailDialog report={active} open={open} onOpenChange={setOpen} />
        </div>
    );
}
