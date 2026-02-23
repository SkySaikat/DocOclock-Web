import React from 'react';
import { BadgeCheck, Star, MapPin, Briefcase, ChevronRight, Users, Award } from 'lucide-react';

interface DoctorCardProps {
    doctor: {
        name: string;
        specialty: string;
        bmdcNumber: string;
        experience?: string | number;
        rating?: number;
        reviews?: number;
        totalPatients?: number;
        image?: string;
        hospitalName?: string;
    };
    ctaLabel?: string;
    onCtaClick?: () => void;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({
    doctor,
    ctaLabel = 'Book Appointment',
    onCtaClick
}) => {
    return (
        <div className="flex-shrink-0 w-[280px] md:w-[320px] rounded-[32px] bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-5 flex flex-col gap-5 hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
            {/* Background Decorative Element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-100/50 transition-colors duration-500"></div>

            <div className="flex items-start gap-4 relative z-10">
                {/* Doctor Image with Premium Ring */}
                <div className="relative shrink-0">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center ring-4 ring-slate-50 shadow-sm group-hover:ring-blue-50 transition-all duration-500">
                        {doctor.image ? (
                            <img
                                src={doctor.image}
                                alt={doctor.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                <span className="text-white font-black text-2xl">{(doctor.name || '?').charAt(0)}</span>
                            </div>
                        )}
                    </div>
                    {doctor.rating && (
                        <div className="absolute -bottom-2 -right-2 bg-white shadow-premium border border-slate-50 text-[10px] px-2 py-1 rounded-lg flex items-center gap-1 z-10">
                            <Star size={10} className="fill-amber-400 text-amber-400" />
                            <span className="font-black text-slate-800">{doctor.rating}</span>
                        </div>
                    )}
                </div>

                {/* Info Header */}
                <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center gap-1 mb-0.5">
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md">
                            {doctor.specialty}
                        </span>
                    </div>
                    <h3 className="text-[17px] font-black text-slate-900 leading-tight truncate group-hover:text-blue-600 transition-colors">
                        {doctor.name}
                    </h3>
                    <div className="flex items-center gap-1 text-emerald-600">
                        <BadgeCheck size={12} className="fill-emerald-50" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Verified</span>
                    </div>
                </div>
            </div>

            {/* Stats Grid - Premium Micro-cards */}
            <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-50/50 p-2.5 rounded-2xl flex flex-col items-center justify-center text-center border border-slate-100/50 transition-colors group-hover:bg-white group-hover:border-blue-100">
                    <Users size={14} className="text-blue-500 mb-1" />
                    <p className="text-[11px] font-black text-slate-900 leading-none">{doctor.totalPatients || '2.5k'}+</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Patients</p>
                </div>
                <div className="bg-slate-50/50 p-2.5 rounded-2xl flex flex-col items-center justify-center text-center border border-slate-100/50 transition-colors group-hover:bg-white group-hover:border-blue-100">
                    <Award size={14} className="text-indigo-500 mb-1" />
                    <p className="text-[11px] font-black text-slate-900 leading-none">{doctor.experience || '10'}+ Yr</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Exp.</p>
                </div>
                <div className="bg-slate-50/50 p-2.5 rounded-2xl flex flex-col items-center justify-center text-center border border-slate-100/50 transition-colors group-hover:bg-white group-hover:border-blue-100">
                    <Star size={14} className="text-amber-500 mb-1" />
                    <p className="text-[11px] font-black text-slate-900 leading-none">{doctor.rating || '4.8'}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Rating</p>
                </div>
            </div>

            <div className="space-y-3 mt-1">
                {doctor.hospitalName && (
                    <div className="flex items-center gap-2 text-[12px] text-slate-500 font-medium">
                        <div className="bg-slate-100 p-1.5 rounded-lg shrink-0">
                            <MapPin size={12} className="text-slate-400" />
                        </div>
                        <span className="truncate">{doctor.hospitalName}</span>
                    </div>
                )}

                {onCtaClick && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onCtaClick();
                        }}
                        className="w-full h-12 rounded-[20px] bg-slate-900 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:bg-blue-600 hover:shadow-xl hover:shadow-blue-200 active:scale-95 group-hover:bg-slate-800"
                    >
                        {ctaLabel}
                        <div className="bg-white/20 p-1 rounded-lg">
                            <ChevronRight size={14} />
                        </div>
                    </button>
                )}
            </div>
        </div>
    );
};
