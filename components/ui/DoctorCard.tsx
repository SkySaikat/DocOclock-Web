import React from 'react';
import { Star, MapPin, ChevronRight, Users, Clock } from 'lucide-react';

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
        <div className="flex-shrink-0 w-[260px] md:w-[280px] rounded-ds-lg bg-white shadow-ds-card flex flex-col group relative overflow-hidden hover:shadow-ds-soft transition-all duration-300">
            {/* Photo header */}
            <div className="relative h-44 bg-medical-50 shrink-0">
                {doctor.image ? (
                    <img
                        src={doctor.image}
                        alt={doctor.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full bg-medical-100/60 flex items-center justify-center">
                        <span className="text-medical-400 font-display font-bold text-4xl">{(doctor.name || '?').charAt(0)}</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-transparent" />
                <span className="absolute top-3 right-3 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full">
                    {doctor.specialty}
                </span>
            </div>

            <div className="p-4 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <h3 className="font-display text-[15px] font-bold text-ink-800 leading-tight truncate group-hover:text-medical-600 transition-colors">
                            {doctor.name}
                        </h3>
                        {doctor.hospitalName && (
                            <div className="flex items-center gap-1 text-ink-500 mt-1">
                                <MapPin size={10} className="shrink-0" />
                                <span className="text-[11px] font-medium truncate">{doctor.hospitalName}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <Star size={14} className="text-amber-500 fill-amber-500" />
                        <span className="text-[13px] font-bold text-ink-800">{doctor.rating || '4.5'}</span>
                    </div>
                </div>

                {/* Stat panels — Figma "Experience / Patients" pattern */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-2xl bg-ink-50 flex flex-col items-center justify-center gap-1 py-3">
                        <span className="text-xl font-medium text-ink-900 leading-none">{doctor.experience || '10'}+</span>
                        <span className="flex items-center gap-1 text-[10px] font-medium text-ink-600">
                            <Clock size={10} /> Experience
                        </span>
                    </div>
                    <div className="rounded-2xl bg-ink-50 flex flex-col items-center justify-center gap-1 py-3">
                        <span className="text-xl font-medium text-ink-900 leading-none">{doctor.totalPatients || '2.5K'}+</span>
                        <span className="flex items-center gap-1 text-[10px] font-medium text-ink-600">
                            <Users size={10} /> Patients
                        </span>
                    </div>
                </div>

                {onCtaClick && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onCtaClick();
                        }}
                        className="w-full h-11 rounded-full bg-gradient-to-b from-medical-500 to-medical-600 text-white font-display font-semibold text-[13px] flex items-center justify-center gap-2 transition-all hover:brightness-105 active:scale-95"
                    >
                        {ctaLabel}
                        <ChevronRight size={14} />
                    </button>
                )}
            </div>
        </div>
    );
};
