'use client';

import { Fragment, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useMapData } from '@/features/admin/hooks/useMapData';

/** Mumbai — default view when no tasks or volunteer points yet */
const DEFAULT_CENTER: [number, number] = [19.076, 72.8777];
const DEFAULT_ZOOM = 12;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const taskMarkerIcon = L.divIcon({
    html: `<div style="width:14px;height:14px;border-radius:9999px;background:#2563eb;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.25)"></div>`,
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
});

const volunteerIconActive = L.divIcon({
    html: `<div style="width:16px;height:16px;border-radius:9999px;background:#10b981;border:2px solid #fff;box-shadow:0 0 10px rgba(16,185,129,0.65)"></div>`,
    className: '',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
});

const volunteerIconIdle = L.divIcon({
    html: `<div style="width:12px;height:12px;border-radius:9999px;background:#94a3b8;border:2px solid #fff;opacity:0.85"></div>`,
    className: '',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
});

function MapSkeleton() {
    return (
        <div className="w-full h-full min-h-[420px] relative rounded-3xl overflow-hidden border border-slate-200 bg-slate-100 animate-pulse">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-200/80 via-slate-100 to-slate-200/60" />
            <div className="absolute inset-8 rounded-2xl border border-dashed border-slate-300/80 bg-slate-50/50" />
            <div className="absolute bottom-6 left-6 right-6 h-3 rounded-full bg-slate-200/90" />
            <div className="absolute top-6 left-6 h-8 w-40 rounded-lg bg-slate-200/90" />
            <p className="absolute inset-0 flex items-center justify-center text-sm font-bold tracking-wide text-slate-400">
                Loading live geofence map…
            </p>
        </div>
    );
}

export default function LiveMap() {
    const { data, isLoading, isError, error, isFetching, dataUpdatedAt } = useMapData();

    const center = useMemo((): [number, number] => {
        if (!data) return DEFAULT_CENTER;
        if (data.tasks.length > 0) return [data.tasks[0].lat, data.tasks[0].lng];
        if (data.volunteers.length > 0) return [data.volunteers[0].lat, data.volunteers[0].lng];
        return DEFAULT_CENTER;
    }, [data]);

    const tasks = data?.tasks ?? [];
    const volunteers = data?.volunteers ?? [];
    const hasPoints = tasks.length > 0 || volunteers.length > 0;

    if (isLoading && !data) {
        return <MapSkeleton />;
    }

    return (
        <div className="w-full h-full min-h-[420px] relative rounded-3xl overflow-hidden border border-slate-200 shadow-sm z-10">
            <MapContainer
                center={center}
                zoom={DEFAULT_ZOOM}
                style={{ height: '100%', width: '100%', minHeight: 420 }}
                scrollWheelZoom
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {tasks.map((task) => (
                    <Fragment key={task.id}>
                        <Circle
                            center={[task.lat, task.lng]}
                            radius={task.radius}
                            pathOptions={{
                                color: '#2563eb',
                                fillColor: '#3b82f6',
                                fillOpacity: 0.18,
                                weight: 2,
                            }}
                        >
                            <Popup className="rounded-xl">
                                <div className="p-1 min-w-[180px]">
                                    <div className="text-[10px] font-bold text-sky-600 uppercase tracking-wider mb-1">
                                        Task geofence
                                    </div>
                                    <h3 className="text-base font-bold text-slate-800">{task.title}</h3>
                                    <p className="text-xs text-slate-500 mt-1 font-mono">Radius: {task.radius}m</p>
                                </div>
                            </Popup>
                        </Circle>
                        <Marker position={[task.lat, task.lng]} icon={taskMarkerIcon}>
                            <Popup className="rounded-xl">
                                <div className="p-1">
                                    <div className="text-[10px] font-bold text-sky-600 uppercase tracking-wider mb-1">
                                        Task center
                                    </div>
                                    <h3 className="text-base font-bold text-slate-800">{task.title}</h3>
                                </div>
                            </Popup>
                        </Marker>
                    </Fragment>
                ))}

                {volunteers.map((v) => (
                    <Marker
                        key={v.id}
                        position={[v.lat, v.lng]}
                        icon={v.status === 'ACTIVE' ? volunteerIconActive : volunteerIconIdle}
                    >
                        <Popup>
                            <div className="p-1">
                                <h4 className="font-bold text-slate-800 text-sm">{v.name}</h4>
                                <p className="text-xs text-slate-500 mt-1">
                                    {v.status === 'ACTIVE' ? (
                                        <span className="text-emerald-600 font-semibold">Checked in</span>
                                    ) : (
                                        <span className="text-slate-500">Last known position</span>
                                    )}
                                </p>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            <div className="absolute top-4 left-4 z-[400] bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-slate-100 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Live map</span>
                </div>
                <div className="h-4 w-px bg-slate-200 hidden sm:block" />
                <span className="text-xs font-bold text-slate-600">
                    {volunteers.length}{' '}
                    <span className="text-slate-400 font-medium">volunteers on map</span>
                </span>
                <span className="text-xs font-bold text-slate-600">
                    {tasks.length} <span className="text-slate-400 font-medium">tasks</span>
                </span>
                {isFetching && (
                    <span className="text-[10px] font-semibold text-sky-600 uppercase">Updating…</span>
                )}
            </div>

            <div className="absolute bottom-4 right-4 z-[400] bg-white/95 backdrop-blur-sm px-3 py-2 rounded-xl shadow-md border border-slate-100 text-xs font-semibold text-slate-600 space-y-1.5">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Legend</div>
                <div>🟢 Volunteer (checked in)</div>
                <div>⚪ Volunteer (last position)</div>
                <div>🔵 Task center</div>
                <div>Circle = geofence</div>
            </div>

            {dataUpdatedAt > 0 && (
                <div className="absolute bottom-4 left-4 z-[400] text-[10px] font-medium text-slate-500 bg-white/80 px-2 py-1 rounded-lg border border-slate-100">
                    Updated {new Date(dataUpdatedAt).toLocaleTimeString()}
                </div>
            )}

            {isError && (
                <div className="absolute top-16 left-4 right-4 sm:right-auto z-[400] max-w-md bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold px-3 py-2 rounded-lg shadow-sm">
                    Map data could not be loaded
                    {error && error instanceof Error ? `: ${error.message}` : '.'} Retrying every 10s.
                </div>
            )}

            {!isError && !hasPoints && (
                <div className="absolute top-16 left-4 z-[400] bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold px-3 py-2 rounded-lg shadow-sm max-w-xs">
                    No active tasks or volunteer locations for your organization yet. Data refreshes every 10 seconds.
                </div>
            )}
        </div>
    );
}
