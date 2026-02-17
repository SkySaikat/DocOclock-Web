import React from 'react';
import { BadgeCheck, Star, MapPin, Briefcase, ChevronRight } from 'lucide-react';
import { Button } from './Button';

interface DoctorCardProps {
    doctor: {
        name: string;
        specialty: string;
        bmdcNumber: string;
        experience?: string | number;
        rating?: number;
        reviews?: number;
        image?: string;
        hospitalName?: string;
    };
    ctaLabel?: string;
    onCtaClick?: () => void;
    variant?: 'premium' | 'compact';
}

export const DoctorCard: React.FC<DoctorCardProps> = ({
    doctor,
    ctaLabel = 'Book Appointment',
    onCtaClick
}) => {
    return (
        <div className="flex-shrink-0 w-[260px] md:w-[300px] rounded-[24px] shadow-[0_12px_30px_rgba(0,0,0,0.08)] p-6 flex flex-col gap-4 hover:-translate-y-[6px] transition-all duration-300 border border-white/40 ring-1 ring-slate-900/5 group"
            style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))' }}>
            {/* Header with Centered Image */}
            <div className="flex flex-col items-center">
                <div className="relative">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center ring-4 ring-white shadow-sm transition-transform duration-300 group-hover:scale-105">
                        {doctor.image ? (
                            <img src={doctor.image} alt={doctor.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-blue-500 font-bold text-2xl">{doctor.name.charAt(0)}</span>
                        )}
                    </div>
                    {doctor.rating && (
                        <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 bg-white shadow-sm border border-slate-100 text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1 z-10 whitespace-nowrap">
                            <Star size={10} className="fill-amber-400 text-amber-400" />
                            <span className="font-semibold text-slate-800">{doctor.rating}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Section */}
            <div className="flex flex-col items-center text-center gap-1.5 flex-1">
                <h3 className="text-[18px] font-bold text-slate-900 leading-tight">
                    {doctor.name}
                </h3>
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                    <span className="text-[12px] text-blue-600 font-bold bg-blue-50/80 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        {doctor.specialty}
                    </span>
                    <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 uppercase tracking-widest bg-emerald-50/80 px-2 py-0.5 rounded-md">
                        <BadgeCheck size={10} /> Verified
                    </span>
                </div>

                <div className="space-y-1.5 mt-2 w-full">
                    {doctor.hospitalName && (
                        <div className="flex items-center justify-center gap-1.5 text-[13px] text-slate-700 font-medium">
                            <MapPin size={12} className="text-slate-400 shrink-0" />
                            <span className="truncate">{doctor.hospitalName}</span>
                        </div>
                    )}
                    {doctor.experience && (
                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.1em] flex items-center justify-center gap-1.5">
                            <Briefcase size={12} className="text-slate-400" /> {doctor.experience} Yrs Experience
                        </p>
                    )}
                    <p className="text-[11px] text-slate-400 font-bold tracking-tight">
                        BMDC: <span className="text-slate-600">{doctor.bmdcNumber}</span>
                    </p>
                </div>
            </div>

            {/* Action Section */}
            {onCtaClick && (
                <div className="mt-auto pt-2">
                    <button
                        onClick={onCtaClick}
                        className="w-full h-11 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-blue-500/30 active:scale-95 shadow-md shadow-blue-500/20"
                    >
                        {ctaLabel}
                        <ChevronRight size={16} />
                    </button>
                    {doctor.reviews && (
                        <p className="text-[10px] font-bold text-slate-400 text-center mt-3 uppercase tracking-wider">
                            Based on {doctor.reviews} patient reviews
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};
