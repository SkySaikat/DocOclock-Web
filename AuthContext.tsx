import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';
import bcrypt from 'bcryptjs';
import { UserRole, Patient, Doctor } from './types';
import { PatientStorage, DoctorStorage, AdminStorage, BranchManagerStorage } from './storage';

interface AuthContextType {
    user: any | null;
    profile: any | null;
    setProfile: (p: any) => void;
    setUserRole: (r: UserRole) => void;
    userRole: UserRole | undefined;
    loading: boolean;
    login: (identifier: string, password: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
    signup: (data: any, role: UserRole) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<any | null>(null);
    const [profile, setProfile] = useState<any | null>(null);
    const [userRole, setUserRole] = useState<UserRole | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkConnection = async () => {
            if (!import.meta.env.DEV) return; // Only run diagnostics in development
            try {
                const { error, status } = await supabase.from('profiles').select('id, full_name, role').limit(1).maybeSingle();
                if (error && (status === 404 || error.message.includes('column'))) {
                    console.error('CRITICAL: Table "profiles" is missing columns or does not exist. Error:', error.message);
                }
            } catch (err) {
                console.error('Supabase Connection Check Failed:', err);
            }
        };

        const restoreSession = () => {
            const patientSession = PatientStorage.get();
            const doctorSession = DoctorStorage.get();
            const adminSession = AdminStorage.get();
            const branchManagerSession = BranchManagerStorage.get();

            if (adminSession) {
                if (adminSession.role === 'SUPER_ADMIN') {
                    console.log('Restoring Super Admin Session:', adminSession.id);
                    setProfile(adminSession);
                    setUserRole(UserRole.SUPER_ADMIN);
                } else if (adminSession.role === 'HOSPITAL_ADMIN') {
                    console.log('Restoring Hospital Admin Session:', adminSession.id);
                    setProfile(adminSession);
                    setUserRole(UserRole.HOSPITAL_ADMIN);
                }
            } else if (branchManagerSession) {
                console.log('Restoring Branch Manager Session:', branchManagerSession.id);
                setProfile(branchManagerSession);
                setUserRole(UserRole.BRANCH_MANAGER);
            } else if (doctorSession) {
                console.log('Restoring Doctor Session:', doctorSession.id);
                setProfile(doctorSession);
                setUserRole(UserRole.DOCTOR);
            } else if (patientSession) {
                console.log('Restoring Patient Session:', patientSession.id);
                setProfile(patientSession);
                setUserRole(UserRole.PATIENT);
            }
            setLoading(false);
        };

        checkConnection();
        restoreSession();
    }, []);

    const login = async (identifier: string, password: string, role: UserRole): Promise<{ success: boolean; error?: string }> => {
        try {
            setLoading(true);

            // 1. Check Rate Limit Lockout (non-blocking if function doesn't exist)
            try {
                const { data: isLocked } = await supabase.rpc('check_is_locked', { p_identifier: identifier });
                if (isLocked) {
                    return { success: false, error: 'Account temporarily locked due to multiple failed attempts. Try again in 15 minutes.' };
                }
            } catch { /* Rate limit function may not exist — continue */ }

            const table = 'profiles';
            const column = role === UserRole.PATIENT ? 'email' : ((role === UserRole.SUPER_ADMIN || role === UserRole.HOSPITAL_ADMIN || role === UserRole.BRANCH_MANAGER) ? 'email' : 'bmdc_number');

            console.log(`Attempting login on table: ${table}, column: ${column}, identifier: ${identifier}`);
            const { data, error, status } = await supabase
                .from(table)
                .select('*')
                .eq(column, identifier)
                .maybeSingle(); // Returns null (not error) when 0 rows — avoids 406

            if (error) {
                if (import.meta.env.DEV) console.error('Supabase Login Error:', { error, status });
                try { await supabase.rpc('record_login_attempt', { p_identifier: identifier, p_success: false }); } catch (_) {}
                return { success: false, error: `Database error (${status}). Please try again.` };
            }

            if (!data) {
                try { await supabase.rpc('record_login_attempt', { p_identifier: identifier, p_success: false }); } catch (_) {}
                const fieldLabel = column === 'bmdc_number' ? 'BMDC number' : 'email';
                return { success: false, error: `No account found with that ${fieldLabel}.` };
            }

            // Verify the role matches what's stored in the DB (case-insensitive guard)
            if (data.role?.toUpperCase() !== role.toUpperCase()) {
                return { success: false, error: 'Account type mismatch. Please use the correct login portal.' };
            }

            // [M4] Block unapproved doctors
            if (role === UserRole.DOCTOR && data.registration_status !== 'approved') {
                return { success: false, error: 'Your account is pending approval by the administration.' };
            }

            const isValid = await bcrypt.compare(password, data.password || '');
            
            // Record the outcome of the password check
            try { await supabase.rpc('record_login_attempt', { p_identifier: identifier, p_success: isValid }); } catch (_) {}

            if (!isValid) {
                return { success: false, error: 'Invalid password.' };
            }

            // Success
            const { password: _, ...rawSessionData } = data;

            // Map DB fields to App fields
            const sessionData = {
                ...rawSessionData,
                name: rawSessionData.full_name,
                imageUrl: rawSessionData.image_url,
                image: rawSessionData.image_url
            };

            if (import.meta.env.DEV) console.log('Login Successful for:', sessionData.name);
            setProfile(sessionData);
            setUserRole(role);

            if (role === UserRole.PATIENT) {
                PatientStorage.set(sessionData);
            } else if (role === UserRole.SUPER_ADMIN || role === UserRole.HOSPITAL_ADMIN) {
                AdminStorage.set({ ...sessionData, role: role });
            } else if (role === UserRole.BRANCH_MANAGER) {
                BranchManagerStorage.set({ ...sessionData, role: role });
            } else {
                DoctorStorage.set(sessionData);
            }

            return { success: true };
        } catch (err) {
            console.error('Login error:', err);
            return { success: false, error: 'An unexpected error occurred.' };
        } finally {
            setLoading(false);
        }
    };

    const signup = async (formData: any, role: UserRole): Promise<{ success: boolean; error?: string }> => {
        try {
            setLoading(true);

            // [C5] Block signup for admin roles — only PATIENT and DOCTOR are allowed
            if (role !== UserRole.PATIENT && role !== UserRole.DOCTOR) {
                return { success: false, error: 'Invalid signup role.' };
            }

            const table = 'profiles';
            const identifierColumn = role === UserRole.PATIENT ? 'email' : 'bmdc_number';
            const identifierValue = role === UserRole.PATIENT ? formData.email : formData.bmdcNumber;

            // Check if already exists
            console.log(`Checking existence on table: ${table}, column: ${identifierColumn}, value: ${identifierValue}`);
            const { data: existing, error: checkError, status: checkStatus, statusText: checkStatusText } = await supabase
                .from(table)
                .select('id')
                .eq(identifierColumn, identifierValue)
                .maybeSingle();

            if (checkError) {
                console.error('Supabase Existence Check Error:', { checkError, checkStatus, checkStatusText });
                // If it's a 404, it might mean the table doesn't exist or isn't exposed
                if (checkStatus === 404) {
                    return { success: false, error: `Database table "${table}" not found (404). Please verify schema.` };
                }
            }

            if (existing) {
                return { success: false, error: 'User already registered.' };
            }

            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(formData.password, salt);

            const insertData: any = {
                full_name: formData.name,
                role: role,
                password: hash,
                created_at: new Date().toISOString(),
            };

            if (role === UserRole.PATIENT) {
                insertData.email = formData.email;
                if (formData.phone) insertData.phone = formData.phone;
                if (formData.age) insertData.age = parseInt(formData.age);
                if (formData.gender) insertData.gender = formData.gender;
                insertData.relationship = 'Self';
                insertData.registration_status = 'approved'; // Patients are auto-approved
            } else {
                insertData.bmdc_number = formData.bmdcNumber;
                insertData.specialty = formData.specialty;
                insertData.degrees = formData.degrees || 'MBBS';
                insertData.image_url = '';
                insertData.experience_years = 1;
                insertData.registration_status = 'pending'; // Doctors require Super Admin approval
                insertData.total_patients = 0;
                insertData.rating = 5.0;
                insertData.about = 'Passionate healthcare provider.';
                if (formData.email) insertData.email = formData.email;
                if (formData.phone) insertData.phone = formData.phone;
                if (formData.idPhotoUrl) insertData.id_photo_url = formData.idPhotoUrl;
            }

            console.log(`Attempting insert into table: ${table}`, insertData);
            const { data, error, status, statusText } = await supabase
                .from(table)
                .insert([insertData])
                .select()
                .single();

            if (error) {
                console.error('Supabase Insert Error:', { error, status, statusText });
                throw error;
            }

            // For doctors: Don't auto-login since they need admin approval
            if (role === UserRole.DOCTOR) {
                return { success: true, error: 'PENDING_APPROVAL' };
            }

            // Auto login after signup (patients only)
            const { password: _, ...rawSessionData } = data;

            // Map DB fields to App fields
            const sessionData = {
                ...rawSessionData,
                name: rawSessionData.full_name,
                imageUrl: rawSessionData.image_url,
                image: rawSessionData.image_url,
                chambers: rawSessionData.chambers || []
            };

            if (import.meta.env.DEV) console.log('Signup Successful, session data:', sessionData);
            setProfile(sessionData);
            setUserRole(role);

            PatientStorage.set(sessionData);

            return { success: true };
        } catch (err: any) {
            console.error('Signup error (Catch block):', err);
            // Provide more specific error if possible
            const errorMessage = err?.message || err?.details || 'Registration failed.';
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setProfile(null);
        setUserRole(undefined);
        PatientStorage.clear();
        DoctorStorage.clear();
        AdminStorage.clear();
        BranchManagerStorage.clear();
    };

    return (
        <AuthContext.Provider value={{ user, profile, setProfile, setUserRole, userRole, loading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
