import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Task } from '@/features/team-leader/types/team-leader';

const COLORS = ['hsl(173 58% 39%)', 'hsl(215 16% 47%)', 'hsl(142 76% 36%)'];

function aggregate(tasks: Task[]) {
  const counts = { PENDING: 0, IN_PROGRESS: 0, COMPLETED: 0 };
  for (const t of tasks) {
    if (t.status in counts) counts[t.status as keyof typeof counts]++;
  }
  return [
    { name: 'Pending', value: counts.PENDING, fill: COLORS[1] },
    { name: 'In progress', value: counts.IN_PROGRESS, fill: COLORS[0] },
    { name: 'Completed', value: counts.COMPLETED, fill: COLORS[2] },
  ];
}

export function TaskProgressChart({ tasks }: { tasks: Task[] }) {
  const data = aggregate(tasks);
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              borderRadius: '1rem',
              border: '1px solid hsl(var(--border))',
              boxShadow: '0 8px 30px rgb(0 0 0 / 0.08)',
            }}
          />
          <Bar dataKey="value" radius={[10, 10, 0, 0]} maxBarSize={48}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
