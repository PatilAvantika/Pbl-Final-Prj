import dynamic from 'next/dynamic';

const MapNoSSR = dynamic(() => import('./LiveMap'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-slate-50 rounded-3xl border border-slate-200 animate-pulse">
            <div className="text-slate-400 font-bold tracking-wider">LOADING MAP ENGINE...</div>
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
