import React from 'react';
import { BadgeCheck, Star, MapPin, Briefcase, ChevronRight, Users, Award, ShieldCheck } from 'lucide-react';

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
        <div className="flex-shrink-0 w-[260px] md:w-[280px] rounded-[16px] bg-white border border-slate-100 shadow-sm flex flex-col group relative overflow-hidden hover:border-blue-200 transition-all duration-300">
            <div className="p-4 flex flex-col gap-4">
                <div className="flex items-start gap-3">
                    {/* Doctor Image - Disciplined Card style */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-50 shrink-0 border border-slate-100">
                        {doctor.image ? (
                            <img
                                src={doctor.image}
                                alt={doctor.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        ) : (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                <span className="text-slate-400 font-black text-xl">{(doctor.name || '?').charAt(0)}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center gap-1 mb-1">
                            <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-1.5 py-0.5 rounded-md leading-none">
                                {doctor.specialty}
                            </span>
                        </div>
                        <h3 className="text-[15px] font-black text-slate-900 leading-tight truncate group-hover:text-blue-600 transition-colors">
                            {doctor.name}
                        </h3>
                        <div className="flex items-center gap-1 text-emerald-600 mt-1">
                            <ShieldCheck size={10} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Verified Expert</span>
                        </div>
                    </div>
                </div>

                {/* Stats Row - Minimal/Structured */}
                <div className="grid grid-cols-3 bg-slate-50/50 rounded-xl border border-slate-100/50">
                    <div className="p-2 border-r border-slate-100/50 flex flex-col items-center">
                        <span className="text-[10px] font-black text-slate-900 leading-none">{doctor.experience || '10'}+ Yr</span>
                        <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Experience</span>
                    </div>
                    <div className="p-2 border-r border-slate-100/50 flex flex-col items-center">
                        <span className="text-[10px] font-black text-slate-900 leading-none">{doctor.rating || '4.8'}</span>
                        <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Rating</span>
                    </div>
                    <div className="p-2 flex flex-col items-center">
                        <span className="text-[10px] font-black text-slate-900 leading-none">{doctor.totalPatients || '2.5k'}+</span>
                        <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Patients</span>
                    </div>
                </div>

                <div className="space-y-3">
                    {doctor.hospitalName && (
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                            <MapPin size={10} className="text-slate-400 shrink-0" />
                            <span className="truncate">{doctor.hospitalName}</span>
                        </div>
                    )}

                    {onCtaClick && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onCtaClick();
                            }}
                            className="w-full h-11 rounded-[12px] bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:bg-blue-600 active:scale-95"
                        >
                            {ctaLabel}
                            <ChevronRight size={14} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
