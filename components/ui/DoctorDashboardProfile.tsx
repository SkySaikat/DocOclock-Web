import React from 'react';
import { BadgeCheck, Star, MapPin, Award, Users, ChevronRight, Settings } from 'lucide-react';

interface DoctorDashboardProfileProps {
    doctor: {
        name: string;
        specialty: string;
        bmdcNumber: string;
        experience?: string | number;
        rating?: number;
        totalPatients?: number;
        image?: string;
        hospitalName?: string;
    };
    onManageClick?: () => void;
}

export const DoctorDashboardProfile: React.FC<DoctorDashboardProfileProps> = ({
    doctor,
    onManageClick
}) => {
    return (
        <div className="w-full bg-white rounded-ds-xl shadow-ds-soft p-6 md:p-8 relative overflow-hidden group">
            {/* Background Aesthetic Blur */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-medical-50/60 rounded-full blur-3xl -mr-32 -mt-32 transition-colors duration-500 group-hover:bg-medical-100/60"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
                {/* Doctor Image with Premium Ring */}
                <div className="relative shrink-0">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-ds-xl overflow-hidden bg-ink-50 flex items-center justify-center ring-8 ring-ink-50 shadow-inner group-hover:ring-medical-50 transition-all duration-500">
                        {doctor.image ? (
                            <img
                                src={doctor.image}
                                alt={doctor.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-medical-500 to-medical-700 flex items-center justify-center">
                                <span className="text-white font-display font-black text-4xl">{(doctor.name || '?').charAt(0)}</span>
                            </div>
                        )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-white shadow-ds-card text-[10px] px-3 py-1.5 rounded-ds-sm flex items-center gap-1.5 font-black text-ink-800">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        {doctor.rating || '5.0'}
                    </div>
                </div>

                {/* Primary Info Column */}
                <div className="flex-1 text-center md:text-left space-y-4">
                    <div className="space-y-1">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                            <span className="px-3 py-1 rounded-ds-sm bg-medical-50 text-medical-600 text-[10px] font-black uppercase tracking-widest">
                                {doctor.specialty || 'General Practitioner'}
                            </span>
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-ds-sm bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                                <BadgeCheck size={12} className="fill-emerald-50" />
                                Verified
                            </div>
                        </div>
                        <h2 className="font-display text-3xl md:text-4xl font-black text-ink-800 tracking-tight leading-tight">
                            {doctor.name}
                        </h2>
                        <p className="text-xs font-bold text-ink-500 uppercase tracking-widest">
                            BMDC: <span className="text-ink-600">{doctor.bmdcNumber || 'N/A'}</span>
                        </p>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="flex flex-wrap justify-center md:justify-start gap-3 md:gap-4 pt-2">
                        <div className="bg-ink-50 p-3 md:px-5 rounded-ds-md flex items-center gap-3 hover:bg-white transition-all shadow-ds-card">
                            <div className="w-8 h-8 rounded-ds-sm bg-medical-100 text-medical-600 flex items-center justify-center">
                                <Users size={16} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-ink-800 leading-none">{doctor.totalPatients || '2.5k'}+</p>
                                <p className="text-[9px] font-black text-ink-500 uppercase tracking-tighter mt-1">Patients</p>
                            </div>
                        </div>
                        <div className="bg-ink-50 p-3 md:px-5 rounded-ds-md flex items-center gap-3 hover:bg-white transition-all shadow-ds-card">
                            <div className="w-8 h-8 rounded-ds-sm bg-sky-100 text-sky-600 flex items-center justify-center">
                                <Award size={16} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-ink-800 leading-none">{doctor.experience || '10'}+ Yr</p>
                                <p className="text-[9px] font-black text-ink-500 uppercase tracking-tighter mt-1">Exp.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Action Column */}
                <div className="flex flex-col items-center md:items-end justify-center md:min-w-[200px]">
                    <div className="flex items-center gap-3 bg-medical-500 px-6 py-3.5 rounded-ds-md shadow-md shadow-medical-200 group-hover:scale-105 transition-transform duration-500">
                        <MapPin size={18} className="text-white fill-white/20" />
                        <span className="text-sm font-display font-black text-white truncate max-w-[180px] uppercase tracking-wider">
                            {doctor.hospitalName || 'Main Chamber'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
