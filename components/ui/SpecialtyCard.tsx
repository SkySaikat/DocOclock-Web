import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SpecialtyCardProps {
    name: string;
    subtitle?: string;
    icon: LucideIcon;
    color: string;
    bg: string;
    onClick: () => void;
    isSelected?: boolean;
}

export const SpecialtyCard: React.FC<SpecialtyCardProps> = ({
    name,
    subtitle,
    icon: Icon,
    color,
    bg,
    onClick,
    isSelected: active
}) => {
    return (
        <div
            onClick={onClick}
            className={`flex flex-col items-center text-center py-5 px-2 md:py-8 md:px-4 rounded-[16px] md:rounded-ds-lg cursor-pointer transition-all duration-500 group relative overflow-hidden h-full min-h-[115px] md:min-h-[150px] justify-center ${active
                ? 'bg-medical-500 text-white shadow-xl shadow-medical-200'
                : 'bg-white shadow-ds-card hover:shadow-ds-soft hover:-translate-y-1'}`}
        >
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center mb-2 transition-all duration-500 ${active ? 'bg-white/20' : 'bg-slate-50 group-hover:bg-medical-50 shadow-inner'}`}>
                <Icon className={`w-5 h-5 md:w-6 md:h-6 transition-colors duration-500 ${active ? 'text-white' : 'text-medical-500'}`} />
            </div>
            <div className="space-y-0.5">
                <h3 className={`font-display text-[9px] md:text-[13px] font-black leading-tight transition-colors duration-500 ${active ? 'text-white' : 'text-ink-800 group-hover:text-medical-600'}`}>
                    {name}
                </h3>
                {subtitle && (
                    <p className={`text-[7px] md:text-[10px] font-bold leading-tight transition-colors duration-500 ${active ? 'text-white/80' : 'text-slate-400'} line-clamp-1`}>
                        {subtitle}
                    </p>
                )}
            </div>
        </div>

    );
};
