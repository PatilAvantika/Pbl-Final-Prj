import { useMemo } from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const defaultCenter: [number, number] = [19.076, 72.8777];

function icon() {
  return L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });
}

function LocationPicker({
  position,
  onChange,
}: {
  position: [number, number];
  onChange: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return <Marker position={position} icon={icon()} />;
}

export interface MapPickerProps {
  latitude?: number;
  longitude?: number;
  onLocationChange: (lat: number, lng: number) => void;
  className?: string;
}

export function MapPicker({ latitude, longitude, onLocationChange, className }: MapPickerProps) {
  const center = useMemo<[number, number]>(() => {
    if (latitude != null && longitude != null) return [latitude, longitude];
    return defaultCenter;
  }, [latitude, longitude]);

  const pos: [number, number] =
    latitude != null && longitude != null ? [latitude, longitude] : center;

  return (
    <div className={className}>
      <MapContainer center={center} zoom={13} className="h-64 w-full rounded-2xl shadow-sm" scrollWheelZoom>
        <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <LocationPicker position={pos} onChange={onLocationChange} />
      </MapContainer>
      <p className="mt-2 text-xs text-muted-foreground">Tap the map to set the task location.</p>
    </div>
  );
}
