import React from 'react';
import { Calendar, Link, LogOut, Pencil, Unlink, Wallet, ChevronRight } from 'lucide-react';
import { DoctorStorage } from '../../storage';
import { useGoogleCalendar } from '../../hooks/useGoogleCalendar';
import { DashboardButton } from '../../components/dashboard';
import { ProfileHeader, Panel, Row, Value, EntryCard, Avatar } from '../../components/doctor/profile/ProfilePanels';

interface DoctorMoreProps {
    onNavigate: (path: string) => void;
    onLogout: () => void;
}

export const DoctorMore: React.FC<DoctorMoreProps> = ({ onNavigate, onLogout }) => {
    const doctor = DoctorStorage.get();
    const { isConnected, isConfigured, connect, disconnect } = useGoogleCalendar();

    const degrees = String(doctor?.degrees || '').split(/[,;]+/).map(d => d.trim()).filter(Boolean);
    const institutions = String(doctor?.institutions || '').split(/\n+/).map(d => d.trim()).filter(Boolean);

    return (
        // Figma "Doctor Profile" 276:12374 (read-only) + the account tools this screen always carried (payments, Google Calendar, logout).
        <div className="flex animate-fade-in flex-col gap-6 font-display">
            <ProfileHeader title="Doctor Profile" subtitle="How your profile appears to patients">
                <DashboardButton variant="secondary" icon={false} onClick={() => onNavigate('/doctor/practice-settings')} className="px-4">Back</DashboardButton>
                <DashboardButton variant="gradient" icon={<Pencil size={14} />} onClick={() => onNavigate('/doctor/profile-editor')} className="pr-3">
                    <span className="relative z-[1] px-3">Edit Profile</span>
                </DashboardButton>
            </ProfileHeader>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                <Panel title="Personal Information">
                    <Avatar src={doctor?.image} name={doctor?.name} />
                    <Row label="Name"><Value>{doctor?.name}</Value></Row>
                    <Row label="Designation"><Value>{doctor?.specialty}</Value></Row>
                    <div className="grid grid-cols-2 gap-4">
                        <Row label="BMDC Number"><Value>{doctor?.bmdcNumber || doctor?.bmdc_number}</Value></Row>
                        <Row label="Experience"><Value>{doctor?.experience_years != null ? `${doctor.experience_years} years` : undefined}</Value></Row>
                    </div>
                </Panel>
                <Panel title="Experiences">
                    {institutions.length > 0
                        ? institutions.map(i => <EntryCard key={i} title={i} subtitle={doctor?.specialty} />)
                        : <p className="text-ds-body text-content-tertiary">No experience added yet.</p>}
                </Panel>
                <Panel title="Education">
                    {degrees.length > 0
                        ? degrees.map(d => <EntryCard key={d} title={d} />)
                        : <p className="text-ds-body text-content-tertiary">No degrees added yet.</p>}
                </Panel>
            </div>

            {/* Account tools (kept from the old "More" screen) */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <button type="button" onClick={() => onNavigate('/doctor/payment')} className="flex items-center gap-4 rounded-ds-lg bg-white p-5 text-left transition-shadow duration-300 ease-ds-out hover:shadow-ds-rise">
                    <span className="grid size-11 place-items-center rounded-full bg-primary-50 text-primary-500"><Wallet size={20} /></span>
                    <span className="min-w-0 flex-1">
                        <span className="block text-ds-paragraph text-content-primary">Payment & Subscription</span>
                        <span className="block text-ds-small text-content-tertiary">View your earnings summary</span>
                    </span>
                    <ChevronRight size={18} className="text-content-tertiary" />
                </button>

                <div className="flex items-center gap-4 rounded-ds-lg bg-white p-5">
                    <span className={`grid size-11 place-items-center rounded-full ${isConnected ? 'bg-primary-50 text-primary-500' : 'bg-ink-50 text-content-tertiary'}`}><Calendar size={20} /></span>
                    <span className="min-w-0 flex-1">
                        <span className="block text-ds-paragraph text-content-primary">Google Calendar</span>
                        <span className="block text-ds-small text-content-tertiary">
                            {isConnected ? 'Connected — appointments sync automatically' : isConfigured ? 'Connect to sync your appointments' : 'Add VITE_GOOGLE_CLIENT_ID to .env to enable'}
                        </span>
                    </span>
                    {isConnected ? (
                        <button onClick={disconnect} className="inline-flex items-center gap-1.5 rounded-full bg-[#fdecec] px-3 py-2 text-ds-small text-[#ed7272]"><Unlink size={14} /> Disconnect</button>
                    ) : (
                        <button onClick={connect} disabled={!isConfigured} className="btn-sheen relative inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-primary-500 px-3 py-2 text-ds-small text-white disabled:cursor-not-allowed disabled:opacity-40"><Link size={14} /> Connect</button>
                    )}
                </div>

                <button type="button" onClick={onLogout} className="flex items-center gap-4 rounded-ds-lg bg-white p-5 text-left transition-colors duration-300 ease-ds-out hover:bg-[#fdecec]">
                    <span className="grid size-11 place-items-center rounded-full bg-[#fdecec] text-[#ed7272]"><LogOut size={20} /></span>
                    <span className="flex-1 text-ds-paragraph text-[#ed7272]">Logout Account</span>
                </button>
            </div>
        </div>
    );
};
