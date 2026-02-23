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
            className={`flex flex-col items-center text-center py-5 px-2 md:py-8 md:px-4 rounded-[16px] md:rounded-[24px] cursor-pointer transition-all duration-500 group border relative overflow-hidden h-full min-h-[115px] md:min-h-[150px] justify-center ${active
                ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-200'
                : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50/50 hover:-translate-y-1'}`}
        >
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center mb-2 transition-all duration-500 ${active ? 'bg-white/20' : 'bg-slate-50 group-hover:bg-blue-50 shadow-inner'}`}>
                <Icon className={`w-5 h-5 md:w-6 md:h-6 transition-colors duration-500 ${active ? 'text-white' : 'text-blue-500'}`} />
            </div>
            <div className="space-y-0.5">
                <h3 className={`text-[9px] md:text-[13px] font-black leading-tight transition-colors duration-500 ${active ? 'text-white' : 'text-slate-900 group-hover:text-blue-600'}`}>
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
