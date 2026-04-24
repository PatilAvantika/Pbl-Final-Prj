'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView([lat, lng], Math.max(map.getZoom(), 14));
    }, [lat, lng, map]);
    return null;
}

type Props = {
    lat: number;
    lng: number;
    radiusMeters: number;
    className?: string;
};

export default function CreateTaskGeofenceMap({ lat, lng, radiusMeters, className }: Props) {
    return (
        <div className={className ?? 'h-[220px] w-full rounded-2xl overflow-hidden border border-slate-200 z-0'}>
            <MapContainer center={[lat, lng]} zoom={14} className="h-full w-full" scrollWheelZoom>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapRecenter lat={lat} lng={lng} />
                <Marker position={[lat, lng]} />
                <Circle
                    center={[lat, lng]}
                    radius={radiusMeters}
                    pathOptions={{
                        color: '#059669',
                        fillColor: '#34d399',
                        fillOpacity: 0.2,
                        weight: 2,
                    }}
                />
            </MapContainer>
        </div>
    );
}
