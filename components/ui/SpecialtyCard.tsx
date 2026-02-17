import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SpecialtyCardProps {
    name: string;
    icon: LucideIcon;
    color: string;
    bg: string;
    onClick: () => void;
    isSelected?: boolean;
}

export const SpecialtyCard: React.FC<SpecialtyCardProps> = ({
    name,
    icon: Icon,
    color,
    bg,
    onClick,
    isSelected
}) => {
    return (
        <div
            onClick={onClick}
            className={`flex-shrink-0 w-[260px] md:w-[240px] bg-white rounded-[20px] shadow-[0_12px_30px_rgba(0,0,0,0.05)] hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all p-6 flex flex-col items-center text-center cursor-pointer border-2 ${isSelected ? 'border-blue-600 shadow-md scale-105' : 'border-transparent'
                }`}
        >
            <div className={`h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 ${bg}/60 ${color} mb-2 shadow-inner ring-1 ring-white/10`}>
                <Icon size={28} />
            </div>
            <h3 className="mt-2 text-[16px] font-bold text-slate-800 line-clamp-1">
                {name}
            </h3>
        </div>
    );
};
