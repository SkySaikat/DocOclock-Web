import React from 'react';
import { MapPin, Clock, ChevronRight, Hospital, Edit2, Trash2, CreditCard } from 'lucide-react';
import { Button } from './Button';

interface ChamberCardProps {
    chamber: {
        hospitalName: string;
        location: string;
        schedule: { day: number | string; startTime: string; endTime: string }[];
        fee: number;
        availableToday?: boolean;
    };
    onSelect?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
}

export const ChamberCard: React.FC<ChamberCardProps> = ({
    chamber,
    onSelect,
    onEdit,
    onDelete
}) => {
    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="bg-white rounded-[28px] p-6 md:p-8 shadow-soft border border-slate-100 hover:shadow-premium hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-medical-50 text-medical-600 flex items-center justify-center shrink-0 shadow-sm border border-medical-100">
                        <Hospital size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">{chamber.hospitalName}</h3>
                        <p className="text-xs font-bold text-slate-400 flex items-center gap-1">
                            <MapPin size={12} /> {chamber.location}
                        </p>
                    </div>
                </div>

                {(onEdit || onDelete) && (
                    <div className="flex gap-2">
                        {onEdit && (
                            <button onClick={onEdit} className="p-2 text-slate-400 hover:text-medical-600 hover:bg-medical-50 rounded-xl transition-all">
                                <Edit2 size={18} />
                            </button>
                        )}
                        {onDelete && (
                            <button onClick={onDelete} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                <Trash2 size={18} />
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <Clock size={12} /> Visiting Schedule
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {chamber.schedule.map((s, i) => (
                                <span key={i} className="text-[10px] font-black text-slate-700 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                                    {DAY_NAMES[Number(s.day)] || s.day}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="bg-medical-50/50 p-4 rounded-2xl border border-medical-100">
                        <p className="text-[10px] font-black text-medical-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <CreditCard size={12} /> Consultation Fee
                        </p>
                        <p className="text-2xl font-black text-medical-600 leading-none">৳ {chamber.fee}</p>
                    </div>
                </div>

                {onSelect && (
                    <Button
                        onClick={onSelect}
                        fullWidth
                        className="h-14 rounded-2xl bg-white hover:bg-medical-600 hover:text-white border-2 border-medical-600 text-medical-600 font-black text-xs uppercase tracking-widest transition-all shadow-md group"
                    >
                        Select Chamber
                        <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                    </Button>
                )}
            </div>
        </div>
    );
};
