-- DOC OCLOCK - DATABASE SCHEMA SETUP
-- Run this in your Supabase SQL Editor

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table (Doctors and Patients)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'patient', -- 'patient', 'doctor', 'admin'
    password TEXT,
    phone TEXT UNIQUE,
    bmdc_number TEXT UNIQUE,
    age INTEGER,
    gender TEXT,
    relationship TEXT DEFAULT 'Self',
    specialty TEXT,
    degrees TEXT,
    image_url TEXT,
    experience_years INTEGER DEFAULT 0,
    total_patients INTEGER DEFAULT 0,
    rating NUMERIC DEFAULT 5.0,
    about TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Chambers Table
CREATE TABLE IF NOT EXISTS public.chambers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    hospital_name TEXT NOT NULL,
    address TEXT NOT NULL,
    consultation_fee NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Schedules Table
CREATE TABLE IF NOT EXISTS public.schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chamber_id UUID REFERENCES public.chambers(id) ON DELETE CASCADE,
    day_of_week TEXT NOT NULL, -- 'Sunday', 'Monday', etc.
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    max_patients INTEGER NOT NULL DEFAULT 20
);

-- 5. Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id TEXT NOT NULL, -- Can be UUID from profiles or family-ID
    patient_name TEXT NOT NULL,
    patient_phone TEXT NOT NULL,
    doctor_id UUID REFERENCES public.profiles(id),
    doctor_name TEXT NOT NULL,
    hospital_id UUID REFERENCES public.chambers(id),
    hospital_name TEXT NOT NULL,
    chamber_name TEXT,
    chamber_location TEXT,
    fee NUMERIC DEFAULT 0,
    appointment_date DATE NOT NULL,
    appointment_time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'waiting', -- 'waiting', 'consulting', 'completed', 'cancelled'
    serial_number INTEGER NOT NULL,
    is_reserved BOOLEAN DEFAULT FALSE,
    is_visible_to_patient BOOLEAN DEFAULT TRUE,
    category TEXT DEFAULT 'normal', -- 'normal', 'report'
    has_prescription BOOLEAN DEFAULT FALSE,
    prescription_id TEXT,
    cancelled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    arrival_time TIMESTAMPTZ,
    consultation_start_time TIMESTAMPTZ,
    consultation_end_time TIMESTAMPTZ,
    cancelled_by TEXT, -- 'patient', 'doctor'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Add Indexes for Queue & Search Performance
CREATE INDEX IF NOT EXISTS idx_appointments_queue 
ON public.appointments (doctor_id, appointment_date, serial_number);

-- 6. Prescriptions Table
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id TEXT PRIMARY KEY, -- 'rx-XXXXXX'
    appointment_id UUID REFERENCES public.appointments(id),
    doctor_id UUID REFERENCES public.profiles(id),
    patient_id TEXT,
    hospital_id UUID REFERENCES public.chambers(id),
    date DATE NOT NULL,
    diagnosis TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Prescription Medicines Table
CREATE TABLE IF NOT EXISTS public.prescription_medicines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id TEXT REFERENCES public.prescriptions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    dosage TEXT NOT NULL, -- '1+0+1'
    duration_days INTEGER NOT NULL,
    before_after_meal TEXT NOT NULL, -- 'before', 'after'
    start_date DATE NOT NULL
);

-- 8. Queue Sessions Table
CREATE TABLE IF NOT EXISTS public.queue_sessions (
    doctor_id UUID REFERENCES public.profiles(id),
    hospital_id UUID REFERENCES public.chambers(id),
    session_date DATE NOT NULL,
    is_doctor_arrived BOOLEAN DEFAULT FALSE,
    session_status TEXT DEFAULT 'NOT_STARTED', -- 'NOT_STARTED', 'RUNNING'
    meta_status TEXT DEFAULT 'IDLE', -- 'IDLE', 'DELAYED', 'BREAK'
    delay_minutes INTEGER DEFAULT 0,
    delay_started_at TIMESTAMPTZ,
    reserved_slots_count INTEGER DEFAULT 0,
    note TEXT,
    PRIMARY KEY (doctor_id, hospital_id, session_date)
);

-- 9. Simple RLS (Public Access for Demo/Testing)
-- WARNING: For production, implement strict RLS roles.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chambers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for all users" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for all users" ON public.chambers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for all users" ON public.schedules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for all users" ON public.appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for all users" ON public.prescriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for all users" ON public.prescription_medicines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for all users" ON public.queue_sessions FOR ALL USING (true) WITH CHECK (true);
