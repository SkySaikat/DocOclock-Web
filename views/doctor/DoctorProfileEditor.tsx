import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import {
    User, Stethoscope, Award, BookOpen, Clock,
    ChevronLeft, Save, Loader2, Camera, Info,
    MapPin, GraduationCap, Briefcase
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { DoctorStorage } from '../../storage';
import { useAuth } from '../../AuthContext';
import { supabase } from '../../supabase';

interface ProfileEditorProps {
    onBack: () => void;
}

export const DoctorProfileEditor: React.FC<ProfileEditorProps> = ({ onBack }) => {
    const { profile, setProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        name: profile?.name || '',
        specialty: profile?.specialty || '',
        degrees: profile?.degrees || '',
        about: profile?.about || '',
        experience_years: profile?.experience_years || 0,
        institutions: profile?.institutions || '',
        image_url: profile?.image_url || profile?.image || ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            setSuccess(false);

            const { data, error } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.name,
                    specialty: formData.specialty,
                    degrees: formData.degrees,
                    about: formData.about,
                    experience_years: parseInt(formData.experience_years.toString()),
                    image_url: formData.image_url
                })
                .eq('id', profile.id)
                .select()
                .single();

            if (error) throw error;

            // Update local storage and context
            const updatedProfile = {
                ...profile,
                ...data,
                name: data.full_name, // Mapping
                image: data.image_url
            };

            DoctorStorage.set(updatedProfile);
            setProfile(updatedProfile);
            setSuccess(true);

            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error('Error updating profile:', err);
            alert('Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (!e.target.files || e.target.files.length === 0) return;
            setUploading(true);
            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, image_url: data.publicUrl }));
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Error uploading image. Make sure the avatars bucket exists and try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-8 px-2 md:px-0">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                >
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">Edit Profile</h1>
                <div className="w-10 h-10" /> {/* Spacer */}
            </div>

            <div className="space-y-8 px-2 md:px-0">
                {/* Profile Picture Section */}
                <div className="flex flex-col items-center">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-[2rem] bg-slate-100 border-4 border-white shadow-xl overflow-hidden">
                            {uploading ? (
                                <div className="w-full h-full flex items-center justify-center bg-slate-50 text-teal-500">
                                    <Loader2 size={32} className="animate-spin" />
                                </div>
                            ) : formData.image_url ? (
                                <img src={formData.image_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                    <User size={48} />
                                </div>
                            )}
                        </div>
                        <input 
                            type="file" 
                            id="avatar-upload" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleImageUpload} 
                            disabled={uploading}
                        />
                        <button 
                            onClick={() => document.getElementById('avatar-upload')?.click()}
                            disabled={uploading}
                            className="absolute -bottom-2 -right-2 bg-teal-600 text-white p-2.5 rounded-2xl shadow-lg hover:bg-teal-700 transition-colors border-4 border-white disabled:opacity-50"
                        >
                            <Camera size={20} />
                        </button>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Profile Photo</p>
                </div>

                <GlassCard className="p-8 bg-white border-0 shadow-2xl shadow-slate-200/50 rounded-[2.5rem] space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Full Name */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <User size={12} className="text-teal-500" /> Full Name
                            </label>
                            <input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Dr. Full Name"
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none font-bold text-slate-800 transition-all"
                            />
                        </div>

                        {/* Specialty */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Stethoscope size={12} className="text-teal-500" /> Medical Specialty
                            </label>
                            <input
                                name="specialty"
                                value={formData.specialty}
                                onChange={handleChange}
                                placeholder="e.g. Cardiology"
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none font-bold text-slate-800 transition-all"
                            />
                        </div>

                        {/* Degrees */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <GraduationCap size={12} className="text-teal-500" /> Degrees & Qualifications
                            </label>
                            <input
                                name="degrees"
                                value={formData.degrees}
                                onChange={handleChange}
                                placeholder="MBBS, FCPS, MD"
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none font-bold text-slate-800 transition-all"
                            />
                        </div>

                        {/* Experience */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Clock size={12} className="text-teal-500" /> Experience (Years)
                            </label>
                            <input
                                name="experience_years"
                                type="number"
                                value={formData.experience_years}
                                onChange={handleChange}
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none font-bold text-slate-800 transition-all"
                            />
                        </div>
                    </div>

                    {/* About / Bio */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Info size={12} className="text-teal-500" /> Professional Biography
                        </label>
                        <textarea
                            name="about"
                            value={formData.about}
                            onChange={handleChange}
                            rows={4}
                            placeholder="Tell patients about your medical background..."
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none font-bold text-slate-800 transition-all resize-none"
                        />
                    </div>

                    {/* Save Button */}
                    <div className="pt-4">
                        <Button
                            onClick={handleSave}
                            disabled={loading}
                            fullWidth
                            className={`h-14 rounded-2xl font-black text-base shadow-xl transition-all duration-300 ${success ? 'bg-green-500 hover:bg-green-600 shadow-green-500/20' : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/20'}`}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={20} className="animate-spin mr-2" /> Saving Changes...
                                </>
                            ) : success ? (
                                <>
                                    <Award size={20} className="mr-2" /> Profile Updated!
                                </>
                            ) : (
                                <>
                                    <Save size={20} className="mr-2" /> Save Profile Details
                                </>
                            )}
                        </Button>
                    </div>
                </GlassCard>

                {/* Info Box */}
                <div className="bg-blue-50/50 border border-blue-100 rounded-[2rem] p-6 flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-blue-900 mb-1">Verify Your Identity</h4>
                        <p className="text-[12px] text-blue-600 font-medium leading-relaxed">
                            Your BMDC number and primary credentials are locked for verification purposes. Contact support if you need to change your medical license details.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ShieldCheck = ({ size, className }: { size: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" />
    </svg>
);
