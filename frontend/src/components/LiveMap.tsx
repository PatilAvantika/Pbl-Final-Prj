'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Loader2 } from 'lucide-react';
import api from '../lib/axios';

// Fix for default Leaflet markers in React
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom active user icon
const ActiveUserIcon = L.divIcon({
    html: `<div class="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse"></div>`,
    className: '',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
});

interface Task {
    id: string;
    title: string;
    template: string;
    zoneName: string;
    geofenceLat: number;
    geofenceLng: number;
    geofenceRadius: number;
    startTime: string;
    endTime: string;
}

interface Attendance {
    id: string;
    lat: number;
    lng: number;
    timestamp: string;
    type: string;
    user: {
        firstName: string;
        lastName: string;
        role: string;
    };
    task: {
        title: string;
        zoneName: string;
    };
}

export default function LiveMap() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [attendances, setAttendances] = useState<Attendance[]>([]);
    const [loading, setLoading] = useState(true);
    const [mapError, setMapError] = useState<string | null>(null);

    // Center on India broadly for default, or average of tasks
    const [center, setCenter] = useState<[number, number]>([20.5937, 78.9629]);

    useEffect(() => {
        const fetchMapData = async () => {
            try {
                const [tasksResult, attendResult] = await Promise.allSettled([
                    api.get('/tasks'),
                    api.get('/attendance/all')
                ]);

                const fetchedTasks = tasksResult.status === 'fulfilled' ? tasksResult.value.data : [];
                const fetchedAttendances = attendResult.status === 'fulfilled' ? attendResult.value.data : [];

                setTasks(fetchedTasks);
                setAttendances(fetchedAttendances);
                setMapError(
                    tasksResult.status === 'rejected' || attendResult.status === 'rejected'
                        ? 'Some live map data could not be loaded.'
                        : null
                );

                if (fetchedTasks.length > 0) {
                    // Calculate center of first active task or just latest task
                    setCenter([fetchedTasks[0].geofenceLat, fetchedTasks[0].geofenceLng]);
                }
            } catch (error) {
                console.error("Error fetching map data", error);
                setMapError('Unable to load live map data right now.');
            } finally {
                setLoading(false);
            }
        };

        fetchMapData();

        // Refresh every 30 seconds for "live" feel
        const interval = setInterval(fetchMapData, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 rounded-3xl border border-slate-200">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                <p className="mt-4 text-slate-500 font-medium tracking-wide">Initializing Live Map Engine...</p>
            </div>
        );
    }

    // Filter only active "CLOCK_IN" to show on map 
    // In a real scenario we would group by user and take latest status
    const activeUsers = attendances.filter(a => a.type === 'CLOCK_IN');
    const hasMapData = tasks.length > 0 || activeUsers.length > 0;

    return (
        <div className="w-full h-full min-h-[420px] relative rounded-3xl overflow-hidden border border-slate-200 shadow-sm z-10">
            <MapContainer
                center={center}
                zoom={13}
                style={{ height: '100%', width: '100%', minHeight: 420 }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Draw Task Geofences */}
                {tasks.map(task => {
                    const isActive = new Date() >= new Date(task.startTime) && new Date() <= new Date(task.endTime);
                    return (
                        <Circle
                            key={task.id}
                            center={[task.geofenceLat, task.geofenceLng]}
                            radius={task.geofenceRadius}
                            pathOptions={{
                                color: isActive ? '#10b981' : '#cbd5e1',
                                fillColor: isActive ? '#10b981' : '#cbd5e1',
                                fillOpacity: 0.2,
                                weight: 2,
                                dashArray: isActive ? undefined : '5, 5'
                            }}
                        >
                            <Popup className="rounded-xl custom-popup">
                                <div className="p-1">
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{task.template.replace('_', ' ')}</div>
                                    <h3 className="text-lg font-bold text-slate-800 drop-shadow-sm">{task.title}</h3>
                                    <p className="text-sm text-slate-600 font-medium">{task.zoneName}</p>

                                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                                        <span className="text-xs font-bold font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                                            Rad: {task.geofenceRadius}m
                                        </span>
                                        <span className={isActive ? "text-emerald-500 text-xs font-bold flex items-center" : "text-slate-400 text-xs font-bold"}>
                                            {isActive ? <><span className="w-2 h-2 rounded-full bg-emerald-500 mr-1 animate-pulse"></span> ActiveNow</> : "Inactive"}
                                        </span>
                                    </div>
                                </div>
                            </Popup>
                        </Circle>
                    );
                })}

                {/* Draw Active Users */}
                {activeUsers.map(att => (
                    <Marker
                        key={att.id}
                        position={[att.lat, att.lng]}
                        icon={ActiveUserIcon}
                    >
                        <Popup>
                            <div className="p-1">
                                <div className="flex items-center space-x-2 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs uppercase">
                                        {(att.user?.firstName?.[0] || 'U')}{(att.user?.lastName?.[0] || 'N')}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm">{att.user?.firstName || 'Unknown'} {att.user?.lastName || 'User'}</h4>
                                        <p className="text-xs text-slate-500 font-medium">{att.user?.role?.replace('_', ' ') || 'Unknown Role'}</p>
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-slate-100">
                                    <p className="text-xs text-slate-600"><span className="font-bold">Task:</span> {att.task?.title || 'Unknown'}</p>
                                    <p className="text-[10px] text-slate-400 mt-1">{new Date(att.timestamp).toLocaleTimeString()}</p>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}

            </MapContainer>

            {/* Map UI Overlay */}
            <div className="absolute top-4 left-4 z-[400] bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-white flex items-center space-x-3">
                <div className="flex items-center">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 mr-2 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                    <span className="text-xs font-bold text-slate-700 tracking-wide uppercase">Live Field Ops</span>
                </div>
                <div className="h-4 w-px bg-slate-300"></div>
                <div className="text-xs font-bold text-slate-500">
                    {activeUsers.length} <span className="text-slate-400 font-medium">Volunteers</span>
                </div>
                <div className="text-xs font-bold text-slate-500">
                    {tasks.length} <span className="text-slate-400 font-medium">Zones</span>
                </div>
            </div>

            {mapError && (
                <div className="absolute bottom-4 left-4 z-[400] bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-3 py-2 rounded-lg shadow-sm">
                    {mapError}
                </div>
            )}

            {!mapError && !hasMapData && (
                <div className="absolute bottom-4 right-4 z-[400] bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold px-3 py-2 rounded-lg shadow-sm">
                    No live geofence data yet. Create tasks and clock-ins to populate the map.
                </div>
            )}
        </div>
    );
}
