import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, Check, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { SectionEyebrowHeader } from '../../components/ui/SectionEyebrowHeader';
import { supabase } from '../../supabase';

export const ContactUsPage: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const { error: insertError } = await supabase.from('contact_messages').insert([form]);
    setIsSubmitting(false);
    if (insertError) {
      setError('Could not send your message right now. Please try again shortly.');
      return;
    }
    setIsSent(true);
    setForm({ name: '', email: '', message: '' });
  };

  const info = [
    { icon: Mail, label: 'Email', value: 'support@dococlock.com' },
    { icon: Phone, label: 'Phone', value: '+880 1XXX-XXXXXX' },
    { icon: MapPin, label: 'Office', value: 'Dhaka, Bangladesh' },
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-ink-800 pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="pt-12 pb-14 flex flex-col items-center text-center gap-6">
          <SectionEyebrowHeader eyebrow="Get in Touch" title="Contact us" center />
          <p className="text-ink-500 text-base max-w-xl leading-relaxed">
            Questions about booking, your account, or partnering with Dococlock? Send us a message and we'll get back to you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {info.map((item) => (
            <div key={item.label} className="bg-medical-50/60 rounded-ds-lg p-6 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-white text-medical-600 flex items-center justify-center shadow-ds-card shrink-0">
                <item.icon size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-ink-500 uppercase tracking-widest">{item.label}</p>
                <p className="text-sm font-bold text-ink-800">{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-ds-lg shadow-ds-soft p-8 md:p-10 max-w-xl mx-auto">
          {isSent ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-4">
                <Check size={28} />
              </div>
              <h3 className="font-display text-xl font-bold text-ink-800 mb-2">Message sent</h3>
              <p className="text-sm text-ink-500">Thanks for reaching out — our team will reply by email shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3.5 bg-red-50 border border-red-100 text-red-600 text-[12px] font-bold rounded-xl">{error}</div>
              )}
              <div>
                <label className="block text-[10px] font-black text-ink-400 uppercase tracking-widest mb-2 px-1">Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 bg-ink-50 border border-ink-100 rounded-ds-sm focus:ring-4 focus:ring-medical-500/5 focus:border-medical-500 outline-none font-medium text-base transition-all"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-ink-400 uppercase tracking-widest mb-2 px-1">Email</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 bg-ink-50 border border-ink-100 rounded-ds-sm focus:ring-4 focus:ring-medical-500/5 focus:border-medical-500 outline-none font-medium text-base transition-all"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-ink-400 uppercase tracking-widest mb-2 px-1">Message</label>
                <textarea
                  required
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-4 py-3 bg-ink-50 border border-ink-100 rounded-ds-sm focus:ring-4 focus:ring-medical-500/5 focus:border-medical-500 outline-none font-medium text-base transition-all resize-none"
                  placeholder="How can we help?"
                />
              </div>
              <Button type="submit" variant="gradient" fullWidth disabled={isSubmitting} className="h-12 gap-2">
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
