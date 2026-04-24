'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { BadgeCheck, Download, Eye } from 'lucide-react';
import { Card, CardContent } from '@/features/team-leader/components/ui/card';
import { Button } from '@/features/team-leader/components/ui/button';
import type { DonorReportRow } from '../types';
import { formatDateTime } from '../lib/format';
import { CampaignMapPreview } from './CampaignMapPreview';

export function ReportGalleryCard({
    report,
    onView,
    onDownload,
    delay = 0,
}: {
    report: DonorReportRow;
    onView: () => void;
    onDownload?: () => void;
    delay?: number;
}) {
    const volunteer = `${report.user.firstName} ${report.user.lastName}`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.35 }}
        >
            <Card className="overflow-hidden border-slate-200/80 shadow-sm transition-shadow hover:shadow-md">
                <CardContent className="p-0">
                    <div className="grid gap-0 md:grid-cols-2">
                        <div className="grid grid-cols-2 gap-px bg-slate-200">
                            <div className="relative aspect-square bg-slate-100">
                                {report.beforePhotoUrl ? (
                                    <Image
                                        src={report.beforePhotoUrl}
                                        alt="Before"
                                        fill
                                        className="object-cover"
                                        sizes="(max-width:768px) 50vw, 200px"
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-xs text-slate-400">Before</div>
                                )}
                            </div>
                            <div className="relative aspect-square bg-slate-100">
                                {report.afterPhotoUrl ? (
                                    <Image
                                        src={report.afterPhotoUrl}
                                        alt="After"
                                        fill
                                        className="object-cover"
                                        sizes="(max-width:768px) 50vw, 200px"
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-xs text-slate-400">After</div>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col gap-4 p-5">
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-lg font-bold text-slate-900">{report.task.title}</h3>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                                        <BadgeCheck className="h-3 w-3" />
                                        Verified
                                    </span>
                                </div>
                                <p className="mt-1 text-sm font-medium text-slate-500">{report.task.zoneName}</p>
                                <p className="mt-2 text-xs font-semibold text-slate-600">
                                    {formatDateTime(report.timestamp)} · {volunteer}
                                </p>
                                <p className="mt-2 text-sm text-slate-700">
                                    <span className="font-semibold">Waste collected:</span>{' '}
                                    {report.quantityItems ?? '—'}
                                </p>
                            </div>
                            <CampaignMapPreview
                                lat={report.task.geofenceLat}
                                lng={report.task.geofenceLng}
                                className="h-[120px]"
                                title={report.task.title}
                            />
                            <div className="mt-auto flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    className="rounded-xl bg-slate-900 hover:bg-slate-800"
                                    onClick={onView}
                                >
                                    <Eye className="h-4 w-4" />
                                    View details
                                </Button>
                                {onDownload ? (
                                    <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={onDownload}>
                                        <Download className="h-4 w-4" />
                                        PDF
                                    </Button>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
