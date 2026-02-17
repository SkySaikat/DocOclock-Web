import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    label: string;
    value: string | number;
    subValue?: string;
    icon: LucideIcon;
    color?: 'blue' | 'teal' | 'orange' | 'red' | 'green' | 'slate';
    onClick?: () => void;
    loading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
    label,
    value,
    subValue,
    icon: Icon,
    color = 'blue',
    onClick,
    loading
}) => {
    const colorMap = {
        blue: 'from-blue-500/20 to-blue-600/20 text-blue-600 border-blue-100/50 shadow-blue-500/10',
        teal: 'from-teal-500/20 to-teal-600/20 text-teal-600 border-teal-100/50 shadow-teal-500/10',
        orange: 'from-orange-500/20 to-orange-600/20 text-orange-600 border-orange-100/50 shadow-orange-500/10',
        red: 'from-red-500/20 to-red-600/20 text-red-600 border-red-100/50 shadow-red-500/10',
        green: 'from-emerald-500/20 to-emerald-600/20 text-emerald-600 border-emerald-100/50 shadow-emerald-500/10',
        slate: 'from-slate-500/20 to-slate-600/20 text-slate-600 border-slate-100/50 shadow-slate-500/10',
    };

    return (
        <div
            onClick={onClick}
            className={`bg-white/90 backdrop-blur-xl p-5 rounded-3xl shadow-soft border border-slate-100/50 flex items-center gap-5 transition-all duration-300 group ${onClick ? 'cursor-pointer hover:shadow-premium hover:-translate-y-1.5 active:scale-95' : ''}`}
        >
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center shrink-0 border shadow-lg group-hover:scale-110 transition-transform ${colorMap[color]}`}>
                <Icon size={24} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] leading-none mb-2 truncate font-manrope">
                    {label}
                </p>
                <div className="flex items-baseline gap-2">
                    <h4 className="text-2xl font-extrabold text-slate-900 tracking-tighter leading-none font-manrope">
                        {loading ? <div className="w-12 h-6 bg-slate-100 animate-pulse rounded-md" /> : value}
                    </h4>
                    {subValue && (
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                            {subValue}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};
