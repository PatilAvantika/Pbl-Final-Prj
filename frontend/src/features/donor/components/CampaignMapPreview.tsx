'use client';

import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CampaignMapPreview({
    lat,
    lng,
    className,
    title,
}: {
    lat: number;
    lng: number;
    className?: string;
    title?: string;
}) {
    const d = 0.025;
    const bbox = `${lng - d},${lat - d},${lng + d},${lat + d}`;
    const src = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat}%2C${lng}`;

    return (
        <div
            className={cn(
                'relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-inner',
                className,
            )}
        >
            <iframe title={title ?? 'Map preview'} src={src} className="h-full w-full min-h-[140px] border-0" loading="lazy" />
            <div className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-1 rounded-lg bg-white/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600 shadow-sm">
                <MapPin className="h-3 w-3 text-amber-600" />
                Live map
            </div>
        </div>
    );
}
