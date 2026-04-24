import { NextRequest, NextResponse } from 'next/server';

type NominatimReverse = { lat: string; lon: string; display_name: string };

export async function GET(req: NextRequest) {
    const lat = req.nextUrl.searchParams.get('lat');
    const lng = req.nextUrl.searchParams.get('lng');
    const la = lat != null ? Number(lat) : NaN;
    const ln = lng != null ? Number(lng) : NaN;
    if (!Number.isFinite(la) || !Number.isFinite(ln)) {
        return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
    }

    try {
        const url = new URL('https://nominatim.openstreetmap.org/reverse');
        url.searchParams.set('lat', String(la));
        url.searchParams.set('lon', String(ln));
        url.searchParams.set('format', 'json');

        const res = await fetch(url.toString(), {
            headers: {
                Accept: 'application/json',
                'User-Agent': 'NGO-Platform/1.0 (https://github.com/)',
            },
            cache: 'no-store',
        });

        if (!res.ok) {
            return NextResponse.json({ error: 'Reverse geocoding failed' }, { status: 502 });
        }

        const data = (await res.json()) as NominatimReverse;
        const label = data?.display_name ?? `${la.toFixed(5)}, ${ln.toFixed(5)}`;
        return NextResponse.json({
            lat: Number.parseFloat(data.lat) || la,
            lng: Number.parseFloat(data.lon) || ln,
            label,
        });
    } catch {
        return NextResponse.json({ error: 'Reverse geocoding failed' }, { status: 502 });
    }
}
