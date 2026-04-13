'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { toast } from 'sonner';
import {
    Target,
    Loader2,
    MapPin,
    Navigation,
    Users,
    X,
    Search,
    Check,
} from 'lucide-react';

const CreateTaskGeofenceMap = dynamic(() => import('./CreateTaskGeofenceMap'), {
    ssr: false,
    loading: () => (
        <div className="h-[220px] w-full rounded-2xl bg-slate-100 border border-slate-200 animate-pulse flex items-center justify-center text-slate-400 text-sm font-semibold">
            Loading map…
        </div>
    ),
});

const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 };

const TEMPLATES = [
    { value: 'WASTE_COLLECTION', label: 'Waste collection' },
    { value: 'PLANTATION', label: 'Plantation' },
    { value: 'AWARENESS', label: 'Awareness' },
    { value: 'SURVEY', label: 'Survey' },
    { value: 'TRAINING', label: 'Training' },
] as const;

type GeocodeHit = { lat: number; lng: number; label: string };

type VolunteerUser = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
};

type Props = {
    open: boolean;
    onClose: () => void;
};

function parseApiMessage(err: unknown): string {
    const ax = err as { response?: { data?: { message?: string | string[] } } };
    const m = ax.response?.data?.message;
    if (Array.isArray(m)) return m.join(', ');
    if (typeof m === 'string') return m;
    return 'Could not create task';
}

export function CreateTaskModal({ open, onClose }: Props) {
    const queryClient = useQueryClient();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [template, setTemplate] = useState<string>('WASTE_COLLECTION');
    const [locationLabel, setLocationLabel] = useState('');
    const [searchQ, setSearchQ] = useState('');
    const [suggestions, setSuggestions] = useState<GeocodeHit[]>([]);
    const [suggestLoading, setSuggestLoading] = useState(false);
    const [pickLat, setPickLat] = useState<number | null>(null);
    const [pickLng, setPickLng] = useState<number | null>(null);
    const [geofenceRadius, setGeofenceRadius] = useState(100);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
    const [maxVolunteers, setMaxVolunteers] = useState<string>('');
    const [assignedIds, setAssignedIds] = useState<string[]>([]);
    const [volunteerFilter, setVolunteerFilter] = useState('');
    const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

    const reset = useCallback(() => {
        setTitle('');
        setDescription('');
        setTemplate('WASTE_COLLECTION');
        setLocationLabel('');
        setSearchQ('');
        setSuggestions([]);
        setPickLat(null);
        setPickLng(null);
        setGeofenceRadius(100);
        setStartTime('');
        setEndTime('');
        setPriority('MEDIUM');
        setMaxVolunteers('');
        setAssignedIds([]);
        setVolunteerFilter('');
    }, []);

    useEffect(() => {
        if (!open) reset();
    }, [open, reset]);

    const { data: volunteers = [], isPending: volLoading } = useQuery({
        queryKey: ['admin-volunteers-picker'],
        queryFn: async () => {
            const { data } = await api.get<VolunteerUser[]>('/users?role=VOLUNTEER&limit=500');
            return Array.isArray(data) ? data : [];
        },
        enabled: open,
        staleTime: 60_000,
    });

    const filteredVolunteers = useMemo(() => {
        const q = volunteerFilter.trim().toLowerCase();
        if (!q) return volunteers;
        return volunteers.filter(
            (u) =>
                `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q),
        );
    }, [volunteers, volunteerFilter]);

    useEffect(() => {
        if (!open) return;
        if (searchDebounce.current) clearTimeout(searchDebounce.current);
        const q = searchQ.trim();
        if (q.length < 2) {
            setSuggestions([]);
            setSuggestLoading(false);
            return;
        }
        setSuggestLoading(true);
        searchDebounce.current = setTimeout(async () => {
            try {
                const res = await fetch(`/api/nominatim/search?q=${encodeURIComponent(q)}`);
                const data = await res.json();
                if (Array.isArray(data)) setSuggestions(data as GeocodeHit[]);
                else setSuggestions([]);
            } catch {
                setSuggestions([]);
            } finally {
                setSuggestLoading(false);
            }
        }, 400);
        return () => {
            if (searchDebounce.current) clearTimeout(searchDebounce.current);
        };
    }, [searchQ, open]);

    const selectPlace = (hit: GeocodeHit) => {
        setPickLat(hit.lat);
        setPickLng(hit.lng);
        setLocationLabel(hit.label);
        setSearchQ('');
        setSuggestions([]);
    };

    const useMyLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported in this browser');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const la = pos.coords.latitude;
                const ln = pos.coords.longitude;
                try {
                    const res = await fetch(`/api/nominatim/reverse?lat=${la}&lng=${ln}`);
                    const data = await res.json();
                    if (data?.label) {
                        setLocationLabel(data.label);
                        setPickLat(Number(data.lat) || la);
                        setPickLng(Number(data.lng) || ln);
                    } else {
                        setLocationLabel(`${la.toFixed(5)}, ${ln.toFixed(5)}`);
                        setPickLat(la);
                        setPickLng(ln);
                    }
                    toast.success('Location detected');
                } catch {
                    setLocationLabel(`${la.toFixed(5)}, ${ln.toFixed(5)}`);
                    setPickLat(la);
                    setPickLng(ln);
                    toast.success('Coordinates set (label approximate)');
                }
            },
            () => toast.error('Could not read your location'),
            { enableHighAccuracy: true, timeout: 12_000 },
        );
    };

    const mapLat = pickLat ?? DEFAULT_CENTER.lat;
    const mapLng = pickLng ?? DEFAULT_CENTER.lng;

    const timeOk = useMemo(() => {
        if (!startTime || !endTime) return false;
        return new Date(endTime).getTime() > new Date(startTime).getTime();
    }, [startTime, endTime]);

    const maxOk = useMemo(() => {
        if (!maxVolunteers.trim()) return true;
        const n = Number(maxVolunteers);
        if (!Number.isFinite(n) || n < 1) return false;
        return assignedIds.length <= n;
    }, [maxVolunteers, assignedIds.length]);

    const formValid =
        title.trim().length > 0 &&
        description.trim().length > 0 &&
        pickLat != null &&
        pickLng != null &&
        locationLabel.trim().length > 0 &&
        geofenceRadius >= 10 &&
        timeOk &&
        maxOk;

    const createMutation = useMutation({
        mutationFn: async () => {
            const payload = {
                title: title.trim(),
                description: description.trim(),
                template,
                zoneName: locationLabel.trim(),
                geofenceLat: pickLat!,
                geofenceLng: pickLng!,
                geofenceRadius,
                startTime: new Date(startTime).toISOString(),
                endTime: new Date(endTime).toISOString(),
                priority,
                ...(maxVolunteers.trim() ? { maxVolunteers: Number(maxVolunteers) } : {}),
            };
            const { data: task } = await api.post<{ id: string }>('/tasks', payload);
            const id = task?.id;
            if (!id) throw new Error('No task id returned');
            for (const userId of assignedIds) {
                await api.post(`/tasks/${id}/assign`, { userId });
            }
            return task;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['admin-tasks'] });
            toast.success('Task deployed successfully');
            onClose();
        },
        onError: (e) => toast.error(parseApiMessage(e)),
    });

    const toggleAssign = (id: string) => {
        setAssignedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/45 backdrop-blur-sm">
            <div
                className="bg-white rounded-3xl w-full max-w-2xl max-h-[min(92vh,900px)] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
                role="dialog"
                aria-labelledby="create-task-title"
            >
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                    <h2
                        id="create-task-title"
                        className="text-lg font-extrabold text-slate-800 tracking-tight flex items-center gap-2"
                    >
                        <Target className="w-5 h-5 text-emerald-600" />
                        Create field task
                    </h2>
                    <button
                        type="button"
                        onClick={() => !createMutation.isPending && onClose()}
                        className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-200/80"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-5 space-y-5">
                    <section className="space-y-3">
                        <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                            Basic info
                        </h3>
                        <div>
                            <label className="text-xs font-bold text-slate-600">Title *</label>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="mt-1 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500"
                                placeholder="e.g. Ward 12 cleanup"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-600">Description *</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="mt-1 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium resize-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500"
                                placeholder="What will volunteers do on site?"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-600">Template *</label>
                            <select
                                value={template}
                                onChange={(e) => setTemplate(e.target.value)}
                                className="mt-1 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-semibold cursor-pointer focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500"
                            >
                                {TEMPLATES.map((t) => (
                                    <option key={t.value} value={t.value}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5" />
                            Location
                        </h3>
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                value={searchQ}
                                onChange={(e) => setSearchQ(e.target.value)}
                                className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500"
                                placeholder="Search place or address (OpenStreetMap)"
                                autoComplete="off"
                            />
                            {suggestLoading && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                                </div>
                            )}
                            {suggestions.length > 0 && (
                                <ul className="absolute z-20 mt-1 w-full max-h-48 overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg text-sm">
                                    {suggestions.map((s, i) => (
                                        <li key={`${s.lat}-${s.lng}-${i}`}>
                                            <button
                                                type="button"
                                                onClick={() => selectPlace(s)}
                                                className="w-full text-left px-3 py-2.5 hover:bg-emerald-50 text-slate-700 font-medium border-b border-slate-50 last:border-0"
                                            >
                                                {s.label}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={useMyLocation}
                            className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl hover:bg-emerald-100/80 transition-colors"
                        >
                            <Navigation className="w-4 h-4" />
                            Use my current location
                        </button>
                        <div>
                            <label className="text-xs font-bold text-slate-600">Location name (zone) *</label>
                            <input
                                value={locationLabel}
                                onChange={(e) => setLocationLabel(e.target.value)}
                                className="mt-1 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500"
                                placeholder="Filled when you pick a search result (editable)"
                            />
                        </div>
                        <p className="text-[11px] text-slate-500">
                            {pickLat != null && pickLng != null ? (
                                <>
                                    Coordinates:{' '}
                                    <span className="font-mono tabular-nums text-slate-700">
                                        {pickLat.toFixed(6)}, {pickLng.toFixed(6)}
                                    </span>
                                </>
                            ) : (
                                'Pick a search result or use your location to set the pin.'
                            )}
                        </p>
                        <div>
                            <label className="text-xs font-bold text-slate-600">Geofence radius (m) *</label>
                            <input
                                type="number"
                                min={10}
                                max={5000}
                                value={geofenceRadius}
                                onChange={(e) => setGeofenceRadius(Number(e.target.value) || 100)}
                                className="mt-1 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium tabular-nums focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500"
                            />
                        </div>
                        <CreateTaskGeofenceMap lat={mapLat} lng={mapLng} radiusMeters={geofenceRadius} />
                    </section>

                    <section className="space-y-3">
                        <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                            Schedule
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-slate-600">Start *</label>
                                <input
                                    type="datetime-local"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="mt-1 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-600">End *</label>
                                <input
                                    type="datetime-local"
                                    value={endTime}
                                    min={startTime || undefined}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="mt-1 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500"
                                />
                            </div>
                        </div>
                        {startTime && endTime && !timeOk && (
                            <p className="text-xs font-semibold text-red-600">End time must be after start time.</p>
                        )}
                    </section>

                    <section className="space-y-3">
                        <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                            Task settings
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-slate-600">Priority</label>
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')}
                                    className="mt-1 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500"
                                >
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-600">Max volunteers (optional)</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={500}
                                    value={maxVolunteers}
                                    onChange={(e) => setMaxVolunteers(e.target.value)}
                                    placeholder="No cap"
                                    className="mt-1 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium tabular-nums focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500"
                                />
                            </div>
                        </div>
                        {maxVolunteers.trim() && !maxOk && (
                            <p className="text-xs font-semibold text-amber-700">
                                Selected volunteers exceed max. Remove some or raise the cap.
                            </p>
                        )}
                    </section>

                    <section className="space-y-3">
                        <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Users className="w-3.5 h-3.5" />
                            Assign volunteers
                        </h3>
                        <p className="text-[11px] text-slate-500">
                            Loaded from <code className="text-slate-600">GET /users?role=VOLUNTEER</code>
                        </p>
                        {assignedIds.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {assignedIds.map((id) => {
                                    const u = volunteers.find((v) => v.id === id);
                                    return (
                                        <span
                                            key={id}
                                            className="inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-lg bg-emerald-50 text-emerald-900 text-xs font-bold border border-emerald-100"
                                        >
                                            {u ? `${u.firstName} ${u.lastName}` : id.slice(0, 8)}
                                            <button
                                                type="button"
                                                onClick={() => toggleAssign(id)}
                                                className="p-0.5 rounded-md hover:bg-emerald-200/60"
                                                aria-label="Remove"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </span>
                                    );
                                })}
                            </div>
                        )}
                        <input
                            value={volunteerFilter}
                            onChange={(e) => setVolunteerFilter(e.target.value)}
                            placeholder="Filter by name or email…"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                        />
                        <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-white">
                            {volLoading ? (
                                <div className="p-6 flex justify-center text-slate-400">
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                </div>
                            ) : filteredVolunteers.length === 0 ? (
                                <p className="p-4 text-sm text-slate-500 font-medium">No volunteers found.</p>
                            ) : (
                                filteredVolunteers.map((u) => {
                                    const on = assignedIds.includes(u.id);
                                    return (
                                        <button
                                            key={u.id}
                                            type="button"
                                            onClick={() => toggleAssign(u.id)}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                                                on ? 'bg-emerald-50/80' : 'hover:bg-slate-50'
                                            }`}
                                        >
                                            <span
                                                className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
                                                    on
                                                        ? 'bg-emerald-500 border-emerald-500 text-white'
                                                        : 'border-slate-200 text-transparent'
                                                }`}
                                            >
                                                <Check className="w-4 h-4" />
                                            </span>
                                            <span className="flex-1 min-w-0">
                                                <span className="block text-slate-800 font-bold truncate">
                                                    {u.firstName} {u.lastName}
                                                </span>
                                                <span className="block text-xs text-slate-500 truncate">{u.email}</span>
                                            </span>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </section>
                </div>

                <div className="p-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row justify-end gap-2 bg-slate-50/80 shrink-0">
                    <button
                        type="button"
                        disabled={createMutation.isPending}
                        onClick={onClose}
                        className="px-5 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200/80 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={!formValid || createMutation.isPending}
                        onClick={() => createMutation.mutate()}
                        className="px-6 py-3 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-lg"
                    >
                        {createMutation.isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Deploying…
                            </>
                        ) : (
                            'Deploy task'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
