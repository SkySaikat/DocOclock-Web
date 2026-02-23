import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';
import bcrypt from 'bcryptjs';
import { UserRole, Patient, Doctor } from './types';
import { PatientStorage, DoctorStorage } from './storage';

interface AuthContextType {
    user: any | null;
    profile: any | null;
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
            try {
                // Check for multiple critical columns to ensure schema is correct
                const { data, error, status } = await supabase.from('profiles').select('id, full_name, role, password, age').limit(1).maybeSingle();
                console.log('Supabase Connection Check (profiles schema):', { data, error, status });
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

            if (doctorSession) {
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
            const table = 'profiles';
            const column = role === UserRole.PATIENT ? 'phone' : 'bmdc_number';

            console.log(`Attempting login on table: ${table}, column: ${column}, identifier: ${identifier}`);
            const { data, error, status, statusText } = await supabase
                .from(table)
                .select('*')
                .eq(column, identifier)
                .eq('role', role)
                .single();

            if (error || !data) {
                console.error('Supabase Login Error:', { error, status, statusText });
                return { success: false, error: `User not found or connection error (${status}).` };
            }

            const isValid = await bcrypt.compare(password, data.password || '');
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

            console.log('Login Successful for:', sessionData.name);
            setProfile(sessionData);
            setUserRole(role);

            if (role === UserRole.PATIENT) {
                PatientStorage.set(sessionData);
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
            const table = 'profiles';
            const identifierColumn = role === UserRole.PATIENT ? 'phone' : 'bmdc_number';
            const identifierValue = role === UserRole.PATIENT ? formData.phone : formData.bmdcNumber;

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
                insertData.phone = formData.phone;
                insertData.age = parseInt(formData.age);
                insertData.gender = formData.gender;
                insertData.relationship = 'Self';
            } else {
                insertData.bmdc_number = formData.bmdcNumber;
                insertData.specialty = formData.specialty;
                insertData.degrees = formData.degrees || 'MBBS';
                insertData.image_url = `https://picsum.photos/200/200?random=${Date.now()}`;
                insertData.experience_years = 1;
                insertData.total_patients = 0;
                insertData.rating = 5.0;
                insertData.about = 'Passionate healthcare provider.';
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

            // Auto login after signup
            const { password: _, ...rawSessionData } = data;

            // Map DB fields to App fields
            const sessionData = {
                ...rawSessionData,
                name: rawSessionData.full_name,
                imageUrl: rawSessionData.image_url,
                image: rawSessionData.image_url,
                chambers: rawSessionData.chambers || []
            };

            console.log('Signup Successful, session data:', sessionData);
            setProfile(sessionData);
            setUserRole(role);

            if (role === UserRole.PATIENT) {
                PatientStorage.set(sessionData);
            } else {
                DoctorStorage.set(sessionData);
                // Initialize default practice settings
                const practiceKey = `doctor_practice_settings_${sessionData.id}`;
                if (typeof window !== 'undefined' && !localStorage.getItem(practiceKey)) {
                    localStorage.setItem(practiceKey, JSON.stringify({
                        dailyBookingLimit: 40,
                        reportFreeDays: 7,
                        chambers: []
                    }));
                }
            }

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
    };

    return (
        <AuthContext.Provider value={{ user, profile, userRole, loading, login, signup, logout }}>
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
