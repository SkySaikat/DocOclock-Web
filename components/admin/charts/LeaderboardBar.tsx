import React from 'react';

interface LeaderboardRow {
  name: string;
  value: number;
  meta?: string;
}

interface LeaderboardBarProps {
  rows: LeaderboardRow[];
  emptyLabel?: string;
  formatValue?: (value: number) => string;
}

/** Horizontal ranked-bar list — used for the Super Admin hospital leaderboard and similar top-N views. */
export const LeaderboardBar: React.FC<LeaderboardBarProps> = ({ rows, emptyLabel = 'No data yet.', formatValue = (v) => String(v) }) => {
  if (rows.length === 0) {
    return <p className="text-sm font-bold text-ink-400 text-center py-8">{emptyLabel}</p>;
  }
  const max = Math.max(...rows.map(r => r.value), 1);

  return (
    <div className="space-y-3">
      {rows.map((row, i) => (
        <div key={row.name + i} className="space-y-1">
          <div className="flex justify-between items-baseline gap-2 text-xs">
            <span className="font-bold text-ink-700 truncate">{i + 1}. {row.name}</span>
            <span className="font-stat font-black text-ink-800 shrink-0">{formatValue(row.value)}{row.meta ? <span className="text-ink-400 font-bold ml-1">{row.meta}</span> : null}</span>
          </div>
          <div className="w-full bg-ink-100 rounded-full h-2">
            <div className="bg-medical-500 h-2 rounded-full transition-all" style={{ width: `${(row.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
};
