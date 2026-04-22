import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AttendanceRow } from '@/features/team-leader/types/team-leader';

function buildTrend(rows: AttendanceRow[]) {
  const byDay = new Map<string, { present: number; total: number }>();
  for (const r of rows) {
    const d = r.checkInAt.slice(0, 10);
    const cur = byDay.get(d) ?? { present: 0, total: 0 };
    cur.total += 1;
    if (r.gpsOk && (r.faceMatchScore ?? 0) >= 0.7) cur.present += 1;
    byDay.set(d, cur);
  }
  const sorted = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-7);
  return sorted.map(([day, { present, total }]) => ({
    day: day.slice(5),
    pct: total ? Math.round((present / total) * 100) : 0,
  }));
}

export function AttendanceTrendChart({ rows }: { rows: AttendanceRow[] }) {
  const data = buildTrend(rows);
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground flex h-[280px] items-center justify-center px-4 text-center">
        No attendance check-ins in the last 7 days for this feed.
      </p>
    );
  }
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="day" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
          <Tooltip
            formatter={(v: number) => [`${v}%`, 'Verified attendance']}
            contentStyle={{
              borderRadius: '1rem',
              border: '1px solid hsl(var(--border))',
              boxShadow: '0 8px 30px rgb(0 0 0 / 0.08)',
            }}
          />
          <Line
            type="monotone"
            dataKey="pct"
            stroke="hsl(173 58% 39%)"
            strokeWidth={2}
            dot={{ r: 4, fill: 'hsl(173 58% 39%)' }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
