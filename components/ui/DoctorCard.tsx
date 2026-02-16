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
    onCtaClick,
    variant = 'premium'
}) => {
    const isPremium = variant === 'premium';
    const isGrid = variant === 'compact'; // Reuse compact for grid-friendly vertical layout

    return (
        <div className={`bg-white rounded-[28px] shadow-soft border border-slate-100 overflow-hidden transition-all duration-500 hover:shadow-premium hover:-translate-y-1.5 flex flex-col h-full ${isPremium ? 'p-6 md:p-8' : 'p-4 md:p-6'}`}>
            <div className={`flex flex-1 ${isGrid ? 'flex-col text-center' : 'flex-col md:flex-row text-center md:text-left'} gap-6 items-center md:items-start`}>
                {/* Image Section */}
                <div className="relative shrink-0">
                    <div className={`${isGrid ? 'w-32 h-32 mx-auto' : 'w-24 h-24 md:w-36 md:h-36'} rounded-[24px] bg-medical-50 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden`}>
                        {doctor.image ? (
                            <img src={doctor.image} alt={doctor.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-medical-500 font-black text-4xl">{doctor.name.charAt(0)}</span>
                        )}
                    </div>
                    {doctor.rating && (
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white px-3 py-1.5 rounded-xl shadow-lg border border-slate-100 flex items-center gap-1.5">
                            <Star size={12} className="fill-amber-400 text-amber-400" />
                            <span className="text-[11px] font-black text-slate-800">{doctor.rating}</span>
                        </div>
                    )}
                </div>

                {/* Content Section */}
                <div className="flex-1 space-y-4 w-full">
                    <div>
                        <div className={`flex flex-col ${isGrid ? 'items-center' : 'md:items-start items-center'} gap-2 mb-2`}>
                            <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                                {doctor.name}
                            </h3>
                            <div className="flex flex-wrap justify-center md:justify-start gap-2">
                                <span className="px-3 py-1 bg-medical-50 text-medical-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-medical-100 shrink-0">
                                    {doctor.specialty}
                                </span>
                                <span className="px-3 py-1 bg-teal-50 text-teal-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-teal-100 flex items-center gap-1 shrink-0">
                                    <BadgeCheck size={10} /> Verified
                                </span>
                            </div>
                        </div>
                        {doctor.experience && (
                            <p className="text-[10px] font-black text-slate-400 mt-1 flex items-center justify-center md:justify-start gap-1.5 uppercase tracking-widest">
                                <Briefcase size={12} /> {doctor.experience} Years Experience
                            </p>
                        )}
                    </div>

                    <div className="space-y-2 pt-1">
                        {doctor.hospitalName && (
                            <div className={`flex items-start ${isGrid ? 'justify-center' : 'md:justify-start justify-center'} gap-2 text-sm font-bold text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100`}>
                                <MapPin size={16} className="text-medical-500 shrink-0 mt-0.5" />
                                <span className="text-left line-clamp-1">{doctor.hospitalName}</span>
                            </div>
                        )}
                        <p className={`text-[10px] font-black text-slate-400 flex items-center ${isGrid ? 'justify-center' : 'md:justify-start justify-center'} gap-2 uppercase tracking-widest`}>
                            BMDC: <span className="text-slate-800">{doctor.bmdcNumber}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Action Section */}
            {onCtaClick && (
                <div className={`mt-6 w-full ${isGrid ? 'text-center' : ''}`}>
                    <Button
                        onClick={onCtaClick}
                        className="w-full h-14 md:h-16 rounded-[20px] bg-medical-600 hover:bg-medical-500 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-medical-100 group transition-all"
                    >
                        {ctaLabel}
                        <ChevronRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                    {doctor.reviews && (
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center mt-3">
                            Based on {doctor.reviews} patient reviews
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};
