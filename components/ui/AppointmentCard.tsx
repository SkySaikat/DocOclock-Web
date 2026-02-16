import React from 'react';
import { Calendar, Clock, MapPin, Stethoscope, ChevronRight, Activity } from 'lucide-react';
import { Button } from './Button';
import { AppointmentStatus } from '../../types';

interface AppointmentCardProps {
    appointment: {
        patientName: string;
        doctorName: string;
        doctorSpecialty?: string;
        hospitalName: string;
        date: string;
        time: string;
        serialNumber?: number;
        fee?: number;
        status: AppointmentStatus;
    };
    onAction?: () => void;
    onTrack?: () => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
    appointment,
    onAction,
    onTrack
}) => {
    const statusColors = {
        waiting: 'bg-amber-50 text-amber-600 border-amber-100',
        completed: 'bg-green-50 text-green-600 border-green-100',
        cancelled: 'bg-red-50 text-red-400 border-red-100',
        consulting: 'bg-medical-50 text-medical-600 border-medical-100',
        absent: 'bg-slate-50 text-slate-400 border-slate-100'
    };

    return (
        <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-5 space-y-5 transition-all duration-300 hover:shadow-premium group">
            {/* Header: Status and Metadata */}
            <div className="flex justify-between items-start gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-medical-50 text-medical-500 flex items-center justify-center shrink-0">
                        <Stethoscope size={24} />
                    </div>
                    <div>
                        <h4 className="text-lg font-black text-slate-800 tracking-tight leading-none mb-1">{appointment.doctorName}</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{appointment.doctorSpecialty || 'General Practitioner'}</p>
                    </div>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-inner ${statusColors[appointment.status]}`}>
                    {appointment.status}
                </span>
            </div>

            {/* Body: Date, Time, Location */}
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Date & Time</span>
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-100">
                        <div className="text-blue-600 shrink-0"><Calendar size={14} /></div>
                        <span className="text-xs font-bold text-slate-800 tracking-tight">{appointment.date} @ {appointment.time}</span>
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Serial Port</span>
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-100">
                        <div className="text-teal-600 shrink-0"><Activity size={14} /></div>
                        <span className="text-xs font-black text-slate-800 tracking-tight truncate">Serial #{appointment.serialNumber?.toString().padStart(2, '0') || 'N/A'}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                <MapPin size={14} className="text-medical-500 shrink-0" />
                <span className="text-xs font-bold text-slate-600 truncate">{appointment.hospitalName}</span>
            </div>

            {/* Footer: Actions */}
            <div className="flex gap-3 pt-1">
                {onTrack && appointment.status === 'waiting' && (
                    <Button
                        onClick={onTrack}
                        className="flex-1 h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest shadow-none"
                    >
                        Track Queue
                    </Button>
                )}
                {onAction && appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                    <Button
                        onClick={onAction}
                        className={`h-11 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-none border ${appointment.status === 'waiting' ? 'px-4 bg-white text-red-500 border-red-100 hover:bg-red-50' : 'flex-1 bg-medical-600 text-white'}`}
                    >
                        {appointment.status === 'waiting' ? 'Cancel' : 'Action'}
                    </Button>
                )}
            </div>
        </div>
    );
};
