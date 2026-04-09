-- ==============================================================================
-- DOC OCLOCK - UNIFIED & COMPREHENSIVE MAIN SCHEMA (mainData.sql)
-- Combines: 100% Original Base Setup + Fixes + New Architectures
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ==============================================================================
-- 2. PROFILES (USERS) TABLE
-- Reverted to TEXT for roles to prevent uppercase/lowercase Enum mismatch ('DOCTOR', 'PATIENT')
-- Integrates all original fields + new Geolocation/Admin fields
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'PATIENT', -- Support 'PATIENT', 'DOCTOR', 'HOSPITAL_ADMIN', 'SUPER_ADMIN'
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
    
    -- New Fields for Expansion & Geolocation
    email TEXT UNIQUE,
    registration_status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    last_known_ip INET,
    city TEXT,
    location GEOMETRY(Point, 4326),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 3. CHAMBERS TABLE (Restored to Original Structure for UI compatibility)
-- Used functionally in the current app as the Doctor's practice location.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.chambers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    hospital_name TEXT NOT NULL,
    address TEXT NOT NULL,
    consultation_fee NUMERIC NOT NULL DEFAULT 0,
    daily_booking_limit INTEGER DEFAULT 30, -- Added from sync fixes
    fee_report NUMERIC DEFAULT 0, -- Added from sync fixes
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 4. SCHEDULES TABLE (Restored exactly)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chamber_id UUID REFERENCES public.chambers(id) ON DELETE CASCADE,
    day_of_week TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    max_patients INTEGER NOT NULL DEFAULT 20
);

-- ==============================================================================
-- 5. APPOINTMENTS TABLE (Restored exactly)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id TEXT NOT NULL, 
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
    status TEXT NOT NULL DEFAULT 'waiting',
    serial_number INTEGER NOT NULL,
    is_reserved BOOLEAN DEFAULT FALSE,
    is_visible_to_patient BOOLEAN DEFAULT TRUE,
    category TEXT DEFAULT 'normal',
    has_prescription BOOLEAN DEFAULT FALSE,
    prescription_id TEXT,
    cancelled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    arrival_time TIMESTAMPTZ,
    consultation_start_time TIMESTAMPTZ,
    consultation_end_time TIMESTAMPTZ,
    cancelled_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 6. PRESCRIPTIONS & MEDICINES (Restored with Fixes)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id TEXT PRIMARY KEY,
    appointment_id UUID REFERENCES public.appointments(id),
    doctor_id UUID REFERENCES public.profiles(id),
    patient_id TEXT,
    hospital_id UUID REFERENCES public.chambers(id),
    date DATE NOT NULL,
    diagnosis TEXT,
    notes TEXT,
    clinical_findings TEXT, -- Added from fix
    tests_recommended TEXT, -- Added from fix
    follow_up_date DATE, -- Added from fix
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.prescription_medicines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id TEXT REFERENCES public.prescriptions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    duration_days INTEGER NOT NULL,
    before_after_meal TEXT NOT NULL,
    start_date DATE NOT NULL
);

-- ==============================================================================
-- 7. QUEUE SESSIONS (Restored exactly)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.queue_sessions (
    doctor_id UUID REFERENCES public.profiles(id),
    hospital_id UUID REFERENCES public.chambers(id),
    session_date DATE NOT NULL,
    is_doctor_arrived BOOLEAN DEFAULT FALSE,
    session_status TEXT DEFAULT 'NOT_STARTED',
    meta_status TEXT DEFAULT 'IDLE',
    delay_minutes INTEGER DEFAULT 0,
    delay_started_at TIMESTAMPTZ,
    reserved_slots_count INTEGER DEFAULT 0,
    note TEXT,
    PRIMARY KEY (doctor_id, hospital_id, session_date)
);


-- ==============================================================================
-- NEW ARCHITECTURE ADDITIONS (Hospitals, Linking, Reviews)
-- Added alongside the legacy core so the current UI doesn't break
-- ==============================================================================

-- 8. Dedicated Hospitals Table (For Hospital Admins)
CREATE TABLE IF NOT EXISTS public.hospitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    contact_info TEXT,
    location GEOMETRY(Point, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Doctor-Hospital Linking
CREATE TABLE IF NOT EXISTS public.doctor_hospitals (
    doctor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (doctor_id, hospital_id)
);

-- 10. Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (patient_id, doctor_id, appointment_id)
);

-- ==============================================================================
-- 11. INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_appointments_queue ON public.appointments (doctor_id, appointment_date, serial_number);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_hospitals_location ON public.hospitals USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_hospitals_owner ON public.hospitals(owner_id);

-- ==============================================================================
-- 12. RLS ENABLEMENT
-- Note: Strict role-based policies are defined in rls_policies.sql
-- DO NOT create permissive "USING (true)" policies here — they override strict policies.
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chambers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Grant baseline schema access (RLS handles row-level filtering)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ==============================================================================
-- 13. AUTO-TIMESTAMP TRIGGERS
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_profiles ON public.profiles;
CREATE TRIGGER set_timestamp_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS set_timestamp_hospitals ON public.hospitals;
CREATE TRIGGER set_timestamp_hospitals BEFORE UPDATE ON public.hospitals FOR EACH ROW EXECUTE FUNCTION update_modified_column();
