import React from 'react';
import { Calendar, Clock, MapPin, Stethoscope, ChevronRight, Activity } from 'lucide-react';
import { Button } from './Button';
import { AppointmentStatus, Appointment } from '../../types';
import { generateGoogleCalendarLink, downloadICS } from '../../utils/calendar';

interface AppointmentCardProps {
    appointment: {
        id?: string;
        patientName: string;
        doctorName: string;
        doctorSpecialty?: string;
        hospitalName: string;
        chamberLocation?: string;
        category?: string;
        date: string;
        time: string;
        serialNumber?: number;
        fee?: number;
        status: AppointmentStatus;
    };
    onAction?: () => void;
    onTrack?: () => void;
    onReview?: () => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
    appointment,
    onAction,
    onTrack,
    onReview
}) => {
    const statusColors = {
        waiting: 'bg-amber-50 text-amber-600 border-amber-100',
        completed: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        cancelled: 'bg-rose-50 text-rose-500 border-rose-100',
        consulting: 'bg-blue-50 text-blue-600 border-blue-100',
        absent: 'bg-slate-50 text-slate-400 border-slate-100'
    };

    return (
        <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-5 space-y-4 transition-all duration-300 hover:shadow-premium group relative overflow-hidden">
            {/* Header: Status and Metadata */}
            <div className="flex justify-between items-start gap-3 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 text-blue-600 flex items-center justify-center shrink-0 border border-slate-100 shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                        <Stethoscope size={24} />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-slate-900 tracking-tight leading-tight mb-0.5 break-words">{appointment.doctorName}</h4>
                        <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight break-words">{appointment.doctorSpecialty || 'SPECIALIST CONSULTATION'}</p>
                    </div>
                </div>
                <span className={`px-2 py-1 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest border shadow-sm shrink-0 ${statusColors[appointment.status]}`}>
                    {appointment.status}
                </span>
            </div>

            {/* Body: Date, Time, Location */}
            <div className="grid grid-cols-2 gap-2 md:gap-3 relative z-10">
                <div className="space-y-1">
                    <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Date & Time</span>
                    <div className="flex items-center gap-2 bg-slate-50/80 px-2.5 py-2 md:px-3 md:py-2.5 rounded-xl border border-slate-100/50 backdrop-blur-sm group-hover:bg-white group-hover:border-blue-100 transition-all">
                        <Calendar size={13} className="text-blue-500 shrink-0" />
                        <span className="text-[11px] md:text-xs font-bold text-slate-800 tracking-tight leading-tight">{appointment.date} @ {appointment.time}</span>
                    </div>
                </div>
                <div className="space-y-1">
                    <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Serial Port</span>
                    <div className="flex items-center gap-2 bg-slate-50/80 px-2.5 py-2 md:px-3 md:py-2.5 rounded-xl border border-slate-100/50 backdrop-blur-sm group-hover:bg-white group-hover:border-teal-100 transition-all">
                        <Activity size={13} className="text-teal-500 shrink-0" />
                        <span className="text-[11px] md:text-xs font-black text-slate-800 tracking-tight leading-none">#{appointment.serialNumber?.toString().padStart(2, '0') || 'N/A'}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-50/50 px-3 py-2 md:px-4 md:py-2.5 rounded-xl border border-slate-100/50 relative z-10">
                <MapPin size={13} className="text-blue-500 shrink-0" />
                <span className="text-[11px] md:text-xs font-medium text-slate-600 truncate">{appointment.hospitalName}</span>
            </div>

            {/* Footer: Actions */}
            <div className="flex items-center gap-3 pt-1 relative z-10">
                {onTrack && appointment.status === 'waiting' && (
                    <>
                        <Button
                            onClick={onTrack}
                            className="flex-1 h-11 rounded-xl bg-slate-900 hover:bg-black text-white font-black text-[9px] uppercase tracking-widest transition-all"
                        >
                            Track Queue
                        </Button>
                        <div className="flex gap-1.5 h-11">
                            <Button 
                                variant="outline" 
                                onClick={() => downloadICS(appointment as unknown as Appointment)}
                                className="h-full w-14 rounded-xl border-slate-200 text-slate-500 hover:bg-slate-50 p-0 flex items-center justify-center shadow-sm relative group"
                                title="Download ICS"
                            >
                                <Calendar size={16} />
                            </Button>
                            <Button 
                                variant="outline" 
                                onClick={() => window.open(generateGoogleCalendarLink(appointment as unknown as Appointment), '_blank')}
                                className="h-full w-14 rounded-xl border-slate-200 text-blue-500 hover:bg-blue-50 p-0 flex items-center justify-center shadow-sm group"
                                title="Add to Google Calendar"
                            >
                                {/* Simple 'G' indicating Google since we don't have specifically branded icons */}
                                <span className="font-black font-sans text-base">G</span> 
                            </Button>
                        </div>
                    </>
                )}

                {onAction && appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                    <Button
                        onClick={onAction}
                        variant="outline"
                        className={`h-11 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all border-slate-200 ${appointment.status === 'waiting' ? 'flex-1 border-rose-100 text-rose-500 hover:bg-rose-50' : 'flex-1'}`}
                    >
                        {appointment.status === 'waiting' ? 'Cancel' : 'Action'}
                    </Button>
                )}

                {onReview && appointment.status === 'completed' && (
                  <Button
                    onClick={onReview}
                    className="flex-1 h-11 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-[9px] uppercase tracking-widest transition-all shadow-md shadow-teal-500/10"
                  >
                    Share Feedback
                  </Button>
                )}
            </div>
        </div>
    );
};
