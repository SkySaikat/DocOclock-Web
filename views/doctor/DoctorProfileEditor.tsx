import React, { useState, useEffect } from 'react';
import { Check, Loader2, Camera, ShieldCheck } from 'lucide-react';
import { DashboardButton } from '../../components/dashboard';
import { useToast } from '../../components/ToastProvider';
import { ProfileHeader, Panel, Row, FIELD, Avatar, EntryCard } from '../../components/doctor/profile/ProfilePanels';
import { DoctorStorage } from '../../storage';
import { useAuth } from '../../AuthContext';
import { supabase } from '../../supabase';

interface ProfileEditorProps {
    onBack: () => void;
}

export const DoctorProfileEditor: React.FC<ProfileEditorProps> = ({ onBack }) => {
    const { profile, setProfile } = useAuth();
    const { showToast } = useToast();
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
            showToast('Profile updated', 'success');

            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error('Error updating profile:', err);
            showToast('Failed to update profile. Please try again.', 'error');
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
            showToast('Error uploading image. Make sure the avatars bucket exists and try again.', 'error');
        } finally {
            setUploading(false);
        }
    };

    const degreeList = formData.degrees.split(/[,;]+/).map(d => d.trim()).filter(Boolean);
    const institutionList = String(formData.institutions || '').split(/\n+/).map(d => d.trim()).filter(Boolean);

    return (
        // Figma "Edit Doctor Profile" 276:12338: header + Cancel / Save Changes, then Personal Information | Experiences | Education.
        <div className="flex animate-fade-in flex-col gap-6 font-display">
            <ProfileHeader title="Edit Doctor Profile" subtitle="Keep your details up to date for patients">
                <DashboardButton variant="secondary" icon={false} onClick={onBack} className="px-4">Cancel</DashboardButton>
                <DashboardButton variant="primary" icon={loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={16} />} onClick={handleSave} disabled={loading} className="pr-3">
                    <span className="px-3">{loading ? 'Saving...' : success ? 'Saved' : 'Save Changes'}</span>
                </DashboardButton>
            </ProfileHeader>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                <Panel title="Personal Information">
                    <div className="relative w-fit">
                        {uploading ? (
                            <span className="grid size-[78px] place-items-center rounded-full bg-primary-50 text-primary-500"><Loader2 size={24} className="animate-spin" /></span>
                        ) : (
                            <Avatar src={formData.image_url} name={formData.name} />
                        )}
                        <input type="file" id="avatar-upload" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                        <button
                            type="button"
                            onClick={() => document.getElementById('avatar-upload')?.click()}
                            disabled={uploading}
                            aria-label="Change profile photo"
                            className="absolute -bottom-1 -right-1 grid size-8 place-items-center rounded-full border-2 border-white bg-primary-500 text-white disabled:opacity-50"
                        >
                            <Camera size={14} />
                        </button>
                    </div>
                    <Row label="Name"><input name="name" value={formData.name} onChange={handleChange} placeholder="Dr. Full Name" className={FIELD} /></Row>
                    <Row label="Designation"><input name="specialty" value={formData.specialty} onChange={handleChange} placeholder="e.g. Cardiologist" className={FIELD} /></Row>
                    <Row label="Experience (years)"><input name="experience_years" type="number" value={formData.experience_years} onChange={handleChange} className={FIELD} /></Row>
                    <Row label="Professional Biography">
                        <textarea name="about" value={formData.about} onChange={handleChange} rows={4} placeholder="Tell patients about your medical background..." className={`${FIELD} h-auto resize-none py-3`} />
                    </Row>
                </Panel>

                <Panel title="Experiences">
                    {institutionList.length > 0
                        ? institutionList.map(i => <EntryCard key={i} title={i} subtitle={formData.specialty} />)
                        : <p className="text-ds-body text-content-tertiary">No experience added yet.</p>}
                    <p className="flex items-start gap-2 rounded-2xl bg-primary-50 p-4 text-ds-small text-primary-700">
                        <ShieldCheck size={16} className="mt-px shrink-0" />
                        Your BMDC number and primary credentials are locked for verification. Contact support to change your medical license details.
                    </p>
                </Panel>

                <Panel title="Education">
                    <Row label="Degrees & Qualifications"><input name="degrees" value={formData.degrees} onChange={handleChange} placeholder="MBBS, FCPS, MD" className={FIELD} /></Row>
                    {degreeList.map(d => <EntryCard key={d} title={d} />)}
                </Panel>
            </div>
        </div>
    );
};
