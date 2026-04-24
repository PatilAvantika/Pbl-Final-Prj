import dynamic from 'next/dynamic';

const MapNoSSR = dynamic(() => import('./LiveMap'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full min-h-[420px] relative rounded-3xl overflow-hidden border border-slate-200 bg-slate-100 animate-pulse">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-200/70 via-slate-100 to-slate-200/50" />
            <div className="absolute inset-8 rounded-2xl border border-dashed border-slate-300/70 bg-slate-50/40" />
            <p className="absolute inset-0 flex items-center justify-center text-sm font-bold tracking-wide text-slate-400">
                Loading map engine…
            </p>
        </div>
    ),
});

export default function MapDynamic() {
    return (
        <div className="w-full h-full min-h-[420px]">
            <MapNoSSR />
        </div>
    );
}
