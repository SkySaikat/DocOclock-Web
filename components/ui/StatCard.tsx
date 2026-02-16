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
        blue: 'bg-blue-50 text-blue-600',
        teal: 'bg-teal-50 text-teal-600',
        orange: 'bg-orange-50 text-orange-600',
        red: 'bg-red-50 text-red-600',
        green: 'bg-green-50 text-green-600',
        slate: 'bg-slate-50 text-slate-600',
    };

    return (
        <div
            onClick={onClick}
            className={`bg-white p-4 rounded-[20px] shadow-sm ring-1 ring-slate-100/50 flex items-center gap-4 transition-all duration-300 ${onClick ? 'cursor-pointer hover:shadow-premium hover:-translate-y-1 active:scale-95' : ''}`}
        >
            <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center shrink-0 ${colorMap[color]}`}>
                <Icon size={24} />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5 truncate">
                    {label}
                </p>
                <div className="flex items-baseline gap-1.5">
                    <h4 className="text-xl font-bold text-slate-900 tracking-tight leading-none">
                        {loading ? '...' : value}
                    </h4>
                    {subValue && (
                        <span className="text-[10px] font-bold text-slate-400">
                            {subValue}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};
