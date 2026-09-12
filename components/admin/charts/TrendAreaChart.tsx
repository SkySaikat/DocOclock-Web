import React, { useId } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../../contexts/ThemeContext';

interface Series {
  dataKey: string;
  name: string;
  color?: string; // defaults to the live theme primary color
}

interface TrendAreaChartProps {
  data: Record<string, any>[];
  xKey: string;
  series: Series[];
  height?: number;
  emptyLabel?: string;
}

/** Shared trend chart used across Super Admin / Hospital Admin analytics — recolors with the live brand theme. */
export const TrendAreaChart: React.FC<TrendAreaChartProps> = ({ data, xKey, series, height = 260, emptyLabel = 'No data in this period yet.' }) => {
  const { colors } = useTheme();
  const uid = useId().replace(/:/g, '');

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm font-bold text-ink-400" style={{ height }}>
        {emptyLabel}
      </div>
    );
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            {series.map((s, i) => {
              const color = s.color || (i === 0 ? colors.primaryColor : colors.secondaryColor);
              return (
                <linearGradient key={s.dataKey} id={`${uid}-${s.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              );
            })}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey={xKey} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} itemStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
          {series.map((s, i) => {
            const color = s.color || (i === 0 ? colors.primaryColor : colors.secondaryColor);
            return (
              <Area key={s.dataKey} type="monotone" dataKey={s.dataKey} name={s.name} stroke={color} strokeWidth={2.5} fillOpacity={1} fill={`url(#${uid}-${s.dataKey})`} />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
