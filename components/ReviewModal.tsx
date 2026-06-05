import React, { useState } from 'react';
import { Star, X, MessageSquare, ShieldCheck, HeartPulse } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { Button } from './ui/Button';
import { supabase } from '../supabase';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  appointment: {
    id: string;
    doctor_id: string;
    doctor_name: string;
    patient_id: string;
  };
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, onSuccess, appointment }) => {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .insert([{
          doctor_id: appointment.doctor_id,
          patient_id: appointment.patient_id,
          appointment_id: appointment.id,
          rating,
          comment
        }]);

      if (error) throw error;
      
      // Also update doctor's average rating (simplified for demo)
      // In a real app, this would be a database trigger
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to submit review", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <GlassCard className="max-w-md w-full p-8 space-y-8 shadow-2xl scale-in-center overflow-hidden relative">
        {/* Aesthetic Background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 blur-3xl rounded-full" />
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-2">
            <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 shadow-inner border border-teal-100/50">
              <HeartPulse size={28} />
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-1">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">Rate Your Visit</h3>
            <p className="text-slate-500 font-bold text-sm tracking-tight">How was your experience with <span className="text-teal-600">Dr. {appointment.doctor_name}</span>?</p>
          </div>

          <div className="py-10 flex flex-col items-center gap-6">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="transition-all duration-200 active:scale-90"
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(star)}
                >
                  <Star 
                    size={40} 
                    className={`${
                      (hover || rating) >= star 
                      ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' 
                      : 'text-slate-200'
                    } transition-colors`}
                    strokeWidth={2.5}
                  />
                </button>
              ))}
            </div>
            <span className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400">
              {['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating - 1]}
            </span>
          </div>

          <div className="space-y-4">
            <div className="relative group">
              <div className="absolute left-4 top-4 text-slate-300 group-focus-within:text-teal-500 transition-colors">
                <MessageSquare size={18} />
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Any specific comments or feedback?"
                rows={4}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 outline-none font-bold text-sm transition-all placeholder:text-slate-300 resize-none"
              />
            </div>

            <Button
              fullWidth
              className="h-14 rounded-2xl font-black bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-100 text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Submit Feedback <ShieldCheck size={18} /></>
              )}
            </Button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
