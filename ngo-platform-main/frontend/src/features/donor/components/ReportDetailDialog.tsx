'use client';

import { useState } from 'react';
import Image from 'next/image';
import { BadgeCheck, Download, MapPin } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/features/team-leader/components/ui/dialog';
import { Button } from '@/features/team-leader/components/ui/button';
import type { DonorReportRow } from '../types';
import { formatDateTime } from '../lib/format';
import { downloadDonorReportPdf } from '../services/donor-api';
import { CampaignMapPreview } from './CampaignMapPreview';
import { toast } from 'sonner';

export function ReportDetailDialog({
    report,
    open,
    onOpenChange,
}: {
    report: DonorReportRow | null;
    open: boolean;
    onOpenChange: (o: boolean) => void;
}) {
    const [pdfLoading, setPdfLoading] = useState(false);

    if (!report) return null;

    const volunteer = `${report.user.firstName} ${report.user.lastName}`;
    const approver = report.approvedBy
        ? `${report.approvedBy.firstName} ${report.approvedBy.lastName}`
        : null;

    const handlePdf = async () => {
        try {
            setPdfLoading(true);
            await downloadDonorReportPdf(report.id);
            toast.success('PDF downloaded');
        } catch {
            toast.error('Could not download PDF. The report may be unavailable.');
        } finally {
            setPdfLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto sm:rounded-2xl">
                <DialogHeader>
                    <div className="flex flex-wrap items-center gap-2">
                        <DialogTitle className="text-xl">{report.task.title}</DialogTitle>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-emerald-800">
                            <BadgeCheck className="h-3.5 w-3.5" />
                            Verified
                        </span>
                    </div>
                    <DialogDescription className="text-left font-medium text-slate-600">
                        {report.task.zoneName} · {formatDateTime(report.timestamp)}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 sm:grid-cols-2">
                    <figure className="space-y-2">
                        <figcaption className="text-xs font-bold uppercase tracking-wide text-slate-500">Before</figcaption>
                        <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                            {report.beforePhotoUrl ? (
                                <Image
                                    src={report.beforePhotoUrl}
                                    alt="Before"
                                    fill
                                    className="object-cover"
                                    sizes="(max-width:768px) 100vw, 400px"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-sm text-slate-400">No photo</div>
                            )}
                        </div>
                    </figure>
                    <figure className="space-y-2">
                        <figcaption className="text-xs font-bold uppercase tracking-wide text-slate-500">After</figcaption>
                        <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                            {report.afterPhotoUrl ? (
                                <Image
                                    src={report.afterPhotoUrl}
                                    alt="After"
                                    fill
                                    className="object-cover"
                                    sizes="(max-width:768px) 100vw, 400px"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-sm text-slate-400">No photo</div>
                            )}
                        </div>
                    </figure>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm">
                    <p className="font-semibold text-slate-800">
                        Waste / items collected:{' '}
                        <span className="text-amber-800">{report.quantityItems ?? '—'}</span>
                    </p>
                    <p className="mt-2 text-slate-600">
                        <span className="font-semibold text-slate-700">Volunteer:</span> {volunteer}
                    </p>
                    {approver ? (
                        <p className="mt-1 text-slate-600">
                            <span className="font-semibold text-slate-700">Approved by:</span> {approver}
                        </p>
                    ) : null}
                    {report.notes ? (
                        <p className="mt-3 border-t border-slate-200 pt-3 text-slate-600">
                            <span className="font-semibold text-slate-700">Notes:</span> {report.notes}
                        </p>
                    ) : null}
                </div>

                <div>
                    <p className="mb-2 flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                        <MapPin className="h-3.5 w-3.5" />
                        Geo location
                    </p>
                    <CampaignMapPreview
                        lat={report.task.geofenceLat}
                        lng={report.task.geofenceLng}
                        className="h-[180px]"
                        title={report.task.title}
                    />
                </div>

                <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
                    <Button type="button" variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                    <Button
                        type="button"
                        className="rounded-xl bg-amber-600 hover:bg-amber-700"
                        disabled={pdfLoading}
                        onClick={() => void handlePdf()}
                    >
                        <Download className="h-4 w-4" />
                        {pdfLoading ? 'Downloading…' : 'Download (PDF)'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
