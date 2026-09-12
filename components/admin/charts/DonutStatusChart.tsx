import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  completed: '#10b981',
  waiting: '#3b82f6',
  consulting: '#8b5cf6',
  late: '#f59e0b',
  cancelled: '#ef4444',
};
const FALLBACK_COLOR = '#94a3b8';

interface DonutStatusChartProps {
  data: { status: string; count: number }[];
  height?: number;
  centerLabel?: string;
}

/** Appointment-status donut — fixed semantic colors (not the admin-configurable brand color) so status meaning stays consistent regardless of brand theme. */
export const DonutStatusChart: React.FC<DonutStatusChartProps> = ({ data, height = 240, centerLabel }) => {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center text-sm font-bold text-ink-400" style={{ height }}>
        No appointments in this period yet.
      </div>
    );
  }

  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="status" innerRadius="55%" outerRadius="80%" paddingAngle={3}>
            {data.map((entry, i) => (
              <Cell key={i} fill={STATUS_COLORS[entry.status] || FALLBACK_COLOR} stroke="none" />
            ))}
          </Pie>
          <Tooltip formatter={(value: number, name: string) => [value, name]} />
          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'capitalize' }} />
        </PieChart>
      </ResponsiveContainer>
      {centerLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-9">
          <span className="text-2xl font-stat font-bold text-ink-800">{total}</span>
          <span className="text-[10px] text-ink-500 uppercase font-black">{centerLabel}</span>
        </div>
      )}
    </div>
  );
};
