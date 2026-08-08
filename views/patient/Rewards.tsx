import React from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Gift, Award, TrendingUp } from 'lucide-react';

export const Rewards: React.FC = () => {
  return (
    <div className="space-y-6">
       <h1 className="font-display text-2xl font-bold text-ink-800">My Rewards</h1>

       <div className="bg-gradient-to-br from-medical-500 to-medical-700 rounded-ds-lg p-8 text-white shadow-md shadow-medical-200 relative overflow-hidden">
          <div className="relative z-10 text-center">
             <p className="text-medical-100 font-bold uppercase text-sm tracking-widest mb-2">Available Points</p>
             <h2 className="font-stat text-6xl font-extrabold mb-4">450</h2>
             <p className="text-sm opacity-90">Equivalent to ৳ 45.00 discount</p>
          </div>
          <Gift className="absolute -bottom-4 -right-4 text-white opacity-10" size={150} />
       </div>

       <div className="grid grid-cols-2 gap-4">
          <GlassCard className="p-4 flex flex-col items-center text-center">
             <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mb-2">
                <Award size={20}/>
             </div>
             <p className="font-bold text-ink-700">Silver Tier</p>
             <p className="text-xs text-ink-500">Member Status</p>
          </GlassCard>
          <GlassCard className="p-4 flex flex-col items-center text-center">
             <div className="w-10 h-10 bg-medical-50 text-medical-600 rounded-full flex items-center justify-center mb-2">
                <TrendingUp size={20}/>
             </div>
             <p className="font-bold text-ink-700">+50 Pts</p>
             <p className="text-xs text-ink-500">Next Booking</p>
          </GlassCard>
       </div>

       <GlassCard className="p-6">
          <h3 className="font-display font-bold text-ink-800 mb-4">How to use points?</h3>
          <ul className="space-y-3 text-sm text-ink-600">
             <li className="flex gap-2"><span className="text-medical-500 font-bold">1.</span> Book a serial through the app.</li>
             <li className="flex gap-2"><span className="text-medical-500 font-bold">2.</span> Select "Redeem Points" at checkout.</li>
             <li className="flex gap-2"><span className="text-medical-500 font-bold">3.</span> Get instant discount on booking fee.</li>
          </ul>
       </GlassCard>
    </div>
  );
};
