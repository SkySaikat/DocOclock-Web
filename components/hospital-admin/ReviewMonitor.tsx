import React from 'react';
import { Star, MessageSquare } from 'lucide-react';

interface ReviewMonitorProps {
  reviews: any[];
}

export const ReviewMonitor: React.FC<ReviewMonitorProps> = ({ reviews }) => {
  return (
    <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
      <div className="p-6 border-b border-slate-50 flex items-center justify-between">
        <div>
          <h3 className="font-black text-slate-900">Patient Feedback Monitor</h3>
          <p className="text-xs font-bold text-slate-500 mt-1">Recent reviews for doctors at this facility.</p>
        </div>
      </div>
      
      {reviews.length === 0 ? (
        <div className="p-12 text-center text-slate-400">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare size={32} className="text-slate-300" />
          </div>
          <p className="font-bold text-slate-500">No reviews yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {reviews.map(review => (
            <div key={review.id} className="p-6 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-black text-slate-900 text-sm">{review.patient?.full_name || 'Anonymous Patient'}</p>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
                    Reviewed Dr. {review.doctor?.full_name} • {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      size={14} 
                      className={star <= review.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"} 
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm font-medium text-slate-600 leading-relaxed bg-slate-50/80 p-3 flex rounded-xl border border-slate-100 italic">
                "{review.comment || 'No written feedback provided.'}"
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
