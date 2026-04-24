import { NextRequest, NextResponse } from 'next/server';

type NominatimHit = { lat: string; lon: string; display_name: string };

export async function GET(req: NextRequest) {
    const q = req.nextUrl.searchParams.get('q')?.trim();
    if (!q || q.length < 2) {
        return NextResponse.json([]);
    }

    try {
        const url = new URL('https://nominatim.openstreetmap.org/search');
        url.searchParams.set('q', q);
        url.searchParams.set('format', 'json');
        url.searchParams.set('limit', '8');
        url.searchParams.set('addressdetails', '0');

        const res = await fetch(url.toString(), {
            headers: {
                Accept: 'application/json',
                'User-Agent': 'NGO-Platform/1.0 (https://github.com/)',
            },
            cache: 'no-store',
        });

        if (!res.ok) {
            return NextResponse.json({ error: 'Geocoding service error' }, { status: 502 });
        }

        const raw = (await res.json()) as NominatimHit[];
        const list = Array.isArray(raw) ? raw : [];
        const results = list
            .map((r) => ({
                lat: parseFloat(r.lat),
                lng: parseFloat(r.lon),
                label: r.display_name,
            }))
            .filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng));

        return NextResponse.json(results);
    } catch {
        return NextResponse.json({ error: 'Geocoding failed' }, { status: 502 });
    }
}
