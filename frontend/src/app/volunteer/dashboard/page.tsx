'use client';

import { useEffect, useState } from 'react';
import api from '../../../lib/axios';
import { useAuth } from '../../../context/AuthContext';
import { MapPin, CheckCircle, Navigation, Loader2, AlertCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function MobileDashboard() {
    const { user, logout } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [clockingIn, setClockingIn] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    useEffect(() => {
        fetchMyTasks();
    }, []);

    const fetchMyTasks = async () => {
        try {
            setLoading(true);
            const res = await api.get('/tasks/my-tasks');
            setTasks(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const attemptClockIn = (taskId: string) => {
        setErrorMsg(null);
        setSuccessMsg(null);
        setClockingIn(taskId);

        if (!navigator.geolocation) {
            setErrorMsg("Geolocation is not supported by your browser.");
            setClockingIn(null);
            return;
        }

        // High accuracy request to ensure mobile precision
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    // DeviceID logic would usually rely on mobile SDKs (Capacitor/React Native).
                    // For web fallback, we generate/use a stable local device ID.
                    let deviceId = localStorage.getItem('device_id');
                    if (!deviceId) {
                        deviceId = `WEB_${uuidv4()}`;
                        localStorage.setItem('device_id', deviceId);
                    }

                    const payload = {
                        taskId,
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracyMeters: position.coords.accuracy,
                        uniqueRequestId: `REQ_${uuidv4()}`,
                        deviceId: deviceId
                    };

                    const res = await api.post('/attendance/clock-in', payload);
                    setSuccessMsg("Successfully authenticated at secure timezone. Shift logged.");
                } catch (error: any) {
                    setErrorMsg(error.response?.data?.message || "Failed to clock in. GPS distance exceeded?");
                } finally {
                    setClockingIn(null);
                }
            },
            (error) => {
                setErrorMsg("GPS Error: " + error.message);
                setClockingIn(null);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    return (
        <div className="min-h-screen bg-[#FAF9F6] pb-20">
            {/* Mobile App Header */}
            <div className="bg-emerald-600 text-white p-6 rounded-b-[2.5rem] shadow-lg relative overflow-hidden">
                {/* Background art */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
                <div className="absolute top-10 -left-10 w-40 h-40 bg-teal-400 opacity-20 rounded-full blur-2xl"></div>

                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <p className="text-emerald-100 text-sm font-medium tracking-wide">Welcome to FieldOps,</p>
                        <h1 className="text-2xl font-extrabold tracking-tight mt-1">{user?.firstName} {user?.lastName}</h1>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-xl font-bold uppercase shadow-inner">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                </div>

                {/* Global Action */}
                <div className="mt-8 flex space-x-3 relative z-10">
                    <button className="flex-1 bg-white text-emerald-600 py-3 rounded-2xl font-bold shadow-md flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 mr-2" /> Sync Queue
                    </button>
                    <button onClick={logout} className="px-5 bg-emerald-700 hover:bg-emerald-800 transition-colors py-3 rounded-2xl font-bold shadow-md flex items-center justify-center text-sm">
                        Sign Out
                    </button>
                </div>
            </div>

            <div className="p-5 mt-4 space-y-6">
                <h2 className="text-lg font-extrabold text-slate-800 tracking-tight flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-emerald-500" />
                    My Deployments Today
                </h2>

                {errorMsg && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-start text-sm font-medium border border-red-100 shadow-sm animate-in zoom-in-95">
                        <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                        <p>{errorMsg}</p>
                    </div>
                )}

                {successMsg && (
                    <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl flex items-start text-sm font-medium border border-emerald-100 shadow-sm animate-in zoom-in-95">
                        <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                        <p>{successMsg}</p>
                    </div>
                )}

                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin mb-3 text-emerald-500" />
                        <span className="font-bold tracking-widest uppercase text-xs">Locating Assigned Nodes...</span>
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="bg-white border text-center border-slate-200 p-8 rounded-3xl shadow-sm text-slate-500">
                        No active deployments assigned to your ID for today.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {tasks.map((task: any) => (
                            <div key={task.id} className="bg-white border-2 border-slate-100 p-5 rounded-3xl shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-50 to-transparent -z-10 rounded-bl-full opacity-50"></div>

                                <div className="flex items-center space-x-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">
                                    <Navigation className="w-3 h-3 text-emerald-500" />
                                    <span>{task.template.replace('_', ' ')}</span>
                                </div>

                                <h3 className="font-bold text-lg text-slate-800 leading-tight mb-1">{task.title}</h3>
                                <p className="text-slate-500 text-sm font-medium mb-4">{task.zoneName}</p>

                                <div className="flex text-xs font-bold text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-5">
                                    <div className="flex-1">
                                        <span className="block text-slate-400 font-medium mb-0.5 uppercase tracking-wider text-[10px]">Start Window</span>
                                        {new Date(task.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className="w-px bg-slate-200 mx-3"></div>
                                    <div className="flex-1">
                                        <span className="block text-slate-400 font-medium mb-0.5 uppercase tracking-wider text-[10px]">Radius Match</span>
                                        {task.geofenceRadius}m Range
                                    </div>
                                </div>

                                <button
                                    onClick={() => attemptClockIn(task.id)}
                                    disabled={clockingIn === task.id || clockingIn !== null}
                                    className="w-full bg-slate-800 hover:bg-slate-900 disabled:opacity-70 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-lg flex items-center justify-center shadow-slate-900/20 active:scale-95"
                                >
                                    {clockingIn === task.id ? (
                                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Verifying GPS Coordinate...</>
                                    ) : (
                                        'Clock In to Zone'
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* OS Mobile Native-feeling Nav Tab Bar (Mock) */}
            <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex items-center justify-around px-2 z-[999] shadow-[0_-4px_20px_rgba(0,0,0,0.03)] pb-safe-area">
                <div className="flex flex-col items-center flex-1 py-2 text-emerald-600 cursor-pointer">
                    <MapPin className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-bold">Zones</span>
                </div>
                <button onClick={() => window.location.href = '/volunteer/profile'} className="flex flex-col items-center flex-1 py-2 text-slate-400">
                    <div className="w-5 h-5 border-2 border-current rounded-full mb-1 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 bg-current rounded-full mr-0.5 mt-0.5"></div>
                    </div>
                    <span className="text-[10px] font-bold">Profile</span>
                </button>
            </div>
        </div>
    );
}
