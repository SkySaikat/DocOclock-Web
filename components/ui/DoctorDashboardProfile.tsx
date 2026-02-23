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
        <div className="w-full bg-white rounded-[32px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-6 md:p-8 relative overflow-hidden group">
            {/* Background Aesthetic Blur */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/40 rounded-full blur-3xl -mr-32 -mt-32 transition-colors duration-500 group-hover:bg-blue-100/40"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
                {/* Doctor Image with Premium Ring */}
                <div className="relative shrink-0">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-[32px] overflow-hidden bg-slate-50 flex items-center justify-center ring-8 ring-slate-50 shadow-inner group-hover:ring-blue-50 transition-all duration-500">
                        {doctor.image ? (
                            <img
                                src={doctor.image}
                                alt={doctor.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                                <span className="text-white font-black text-4xl">{(doctor.name || '?').charAt(0)}</span>
                            </div>
                        )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-white shadow-lg border border-slate-50 text-[10px] px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-black text-slate-800">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        {doctor.rating || '5.0'}
                    </div>
                </div>

                {/* Primary Info Column */}
                <div className="flex-1 text-center md:text-left space-y-4">
                    <div className="space-y-1">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                            <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-100/50">
                                {doctor.specialty || 'General Practitioner'}
                            </span>
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-100/50">
                                <BadgeCheck size={12} className="fill-emerald-50" />
                                Verified
                            </div>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                            {doctor.name}
                        </h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            BMDC: <span className="text-slate-600">{doctor.bmdcNumber || 'N/A'}</span>
                        </p>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="flex flex-wrap justify-center md:justify-start gap-3 md:gap-4 pt-2">
                        <div className="bg-slate-50/50 p-3 md:px-5 rounded-2xl flex items-center gap-3 border border-slate-100/50 hover:bg-white hover:border-blue-100 transition-all shadow-sm">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                                <Users size={16} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-900 leading-none">{doctor.totalPatients || '2.5k'}+</p>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mt-1">Patients</p>
                            </div>
                        </div>
                        <div className="bg-slate-50/50 p-3 md:px-5 rounded-2xl flex items-center gap-3 border border-slate-100/50 hover:bg-white hover:border-indigo-100 transition-all shadow-sm">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                <Award size={16} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-900 leading-none">{doctor.experience || '10'}+ Yr</p>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mt-1">Exp.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Action Column */}
                <div className="flex flex-col items-center md:items-end justify-between gap-6 md:h-full md:min-w-[240px]">
                    <div className="flex items-center gap-3 bg-slate-50/80 px-5 py-3 rounded-2xl border border-slate-100/50 backdrop-blur-sm">
                        <MapPin size={16} className="text-blue-500" />
                        <span className="text-sm font-bold text-slate-600 truncate max-w-[150px]">
                            {doctor.hospitalName || 'Main Chamber'}
                        </span>
                    </div>

                    {onManageClick && (
                        <button
                            onClick={onManageClick}
                            className="w-full md:w-auto px-8 h-14 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all hover:bg-blue-600 hover:shadow-xl hover:shadow-blue-200 active:scale-95 group/btn"
                        >
                            <Settings size={16} className="group-hover/btn:rotate-90 transition-transform duration-500" />
                            Manage Settings
                            <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
