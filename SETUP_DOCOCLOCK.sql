-- ==============================================================================
-- DOCOCLOCK — COMPLETE DATABASE SETUP
-- Run this ONE file in your Supabase SQL Editor on a fresh database.
--
-- Admin credentials seeded:
--   Super Admin    → superadmin@dococlock.com  / SuperAdmin@2026
--   Hospital Admin → hospital@dococlock.com    / HospitalAdmin@2026
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- TABLES  (in FK dependency order)
-- ==============================================================================

-- 1. PROFILES — all users
CREATE TABLE IF NOT EXISTS public.profiles (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name           TEXT        NOT NULL,
    role                TEXT        NOT NULL DEFAULT 'PATIENT',
    registration_status TEXT        NOT NULL DEFAULT 'approved',
    password            TEXT,
    email               TEXT        UNIQUE,
    phone               TEXT        UNIQUE,
    bmdc_number         TEXT        UNIQUE,
    age                 INTEGER,
    gender              TEXT,
    relationship        TEXT        DEFAULT 'Self',
    specialty           TEXT,
    degrees             TEXT,
    image_url           TEXT,
    experience_years    INTEGER     DEFAULT 0,
    total_patients      INTEGER     DEFAULT 0,
    rating              NUMERIC     DEFAULT 5.0,
    about               TEXT,
    city                TEXT,
    branch_id           UUID,       -- set for BRANCH_MANAGER role
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 2. HOSPITALS — formal hospital/clinic organisations (managed by hospital admins)
CREATE TABLE IF NOT EXISTS public.hospitals (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id        UUID        REFERENCES public.profiles(id) ON DELETE RESTRICT,
    name            TEXT        NOT NULL,
    address         TEXT        NOT NULL,
    contact_info    TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. HOSPITAL BRANCHES
CREATE TABLE IF NOT EXISTS public.hospital_branches (
    id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id  UUID        NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    name         TEXT        NOT NULL,
    address      TEXT        NOT NULL,
    contact_info TEXT,
    manager_id   UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 4. HOSPITAL SECTORS (departments)
CREATE TABLE IF NOT EXISTS public.hospital_sectors (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID        NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    branch_id   UUID        REFERENCES public.hospital_branches(id) ON DELETE CASCADE,
    name        TEXT        NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CHAMBER REQUESTS — doctor requests to join a hospital/branch
CREATE TABLE IF NOT EXISTS public.chamber_requests (
    id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    hospital_id  UUID        NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    branch_id    UUID        REFERENCES public.hospital_branches(id) ON DELETE SET NULL,
    sector_id    UUID        REFERENCES public.hospital_sectors(id)  ON DELETE SET NULL,
    proposed_fee NUMERIC     DEFAULT 0,
    status       TEXT        NOT NULL DEFAULT 'pending',
    reviewed_by  UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at  TIMESTAMPTZ,
    note         TEXT,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CHAMBERS — a doctor's practice slot at a location
--    IMPORTANT: appointments.hospital_id → chambers.id  (historical naming; keep as-is)
--    linked_hospital_id → hospitals.id (optional; set when doctor selects a registered hospital)
CREATE TABLE IF NOT EXISTS public.chambers (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id           UUID        REFERENCES public.profiles(id) ON DELETE CASCADE,
    hospital_name       TEXT        NOT NULL,
    address             TEXT        NOT NULL,
    consultation_fee    NUMERIC     NOT NULL DEFAULT 0,
    fee_report          NUMERIC     DEFAULT 0,
    daily_booking_limit INTEGER     DEFAULT 30,
    linked_hospital_id  UUID        REFERENCES public.hospitals(id) ON DELETE SET NULL,
    branch_id           UUID        REFERENCES public.hospital_branches(id) ON DELETE SET NULL,
    sector_id           UUID        REFERENCES public.hospital_sectors(id)  ON DELETE SET NULL,
    request_id          UUID        REFERENCES public.chamber_requests(id)  ON DELETE SET NULL,
    status              TEXT        NOT NULL DEFAULT 'active',
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SCHEDULES — weekly schedule per chamber
CREATE TABLE IF NOT EXISTS public.schedules (
    id              UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
    chamber_id      UUID    REFERENCES public.chambers(id) ON DELETE CASCADE,
    day_of_week     TEXT    NOT NULL,
    start_time      TEXT    NOT NULL,
    end_time        TEXT    NOT NULL,
    max_patients    INTEGER NOT NULL DEFAULT 20
);

-- 5. APPOINTMENTS  (hospital_id → chambers.id — NOT hospitals.id)
CREATE TABLE IF NOT EXISTS public.appointments (
    id                      UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id              TEXT        NOT NULL,
    patient_name            TEXT        NOT NULL,
    patient_phone           TEXT        NOT NULL,
    patient_age             INTEGER,
    patient_gender          TEXT,
    doctor_id               UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
    doctor_name             TEXT        NOT NULL,
    hospital_id             UUID        REFERENCES public.chambers(id) ON DELETE SET NULL,
    hospital_name           TEXT        NOT NULL,
    chamber_name            TEXT,
    chamber_location        TEXT,
    fee                     NUMERIC     DEFAULT 0,
    appointment_date        DATE        NOT NULL,
    appointment_time        TEXT        NOT NULL,
    status                  TEXT        NOT NULL DEFAULT 'waiting',
    serial_number           INTEGER     NOT NULL,
    is_reserved             BOOLEAN     DEFAULT FALSE,
    is_visible_to_patient   BOOLEAN     DEFAULT TRUE,
    category                TEXT        DEFAULT 'normal',
    has_prescription        BOOLEAN     DEFAULT FALSE,
    prescription_id         TEXT,
    cancelled_at            TIMESTAMPTZ,
    completed_at            TIMESTAMPTZ,
    arrival_time            TIMESTAMPTZ,
    consultation_start_time TIMESTAMPTZ,
    consultation_end_time   TIMESTAMPTZ,
    cancelled_by            TEXT,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PRESCRIPTIONS  (hospital_id → chambers.id)
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id                  TEXT        PRIMARY KEY,
    appointment_id      UUID        REFERENCES public.appointments(id) ON DELETE SET NULL,
    doctor_id           UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
    patient_id          TEXT,
    hospital_id         UUID        REFERENCES public.chambers(id) ON DELETE SET NULL,
    date                DATE        NOT NULL,
    diagnosis           TEXT,
    clinical_findings   TEXT,
    tests_recommended   TEXT,
    follow_up_date      DATE,
    notes               TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PRESCRIPTION MEDICINES
CREATE TABLE IF NOT EXISTS public.prescription_medicines (
    id                UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id   TEXT    REFERENCES public.prescriptions(id) ON DELETE CASCADE,
    name              TEXT    NOT NULL,
    dosage            TEXT    NOT NULL,
    duration_days     INTEGER NOT NULL,
    before_after_meal TEXT    NOT NULL,
    start_date        DATE    NOT NULL
);

-- 8. QUEUE SESSIONS  (hospital_id → chambers.id)
CREATE TABLE IF NOT EXISTS public.queue_sessions (
    doctor_id           UUID        REFERENCES public.profiles(id) ON DELETE CASCADE,
    hospital_id         UUID        REFERENCES public.chambers(id) ON DELETE CASCADE,
    session_date        DATE        NOT NULL,
    is_doctor_arrived   BOOLEAN     DEFAULT FALSE,
    session_status      TEXT        DEFAULT 'NOT_STARTED',
    meta_status         TEXT        DEFAULT 'IDLE',
    delay_minutes       INTEGER     DEFAULT 0,
    delay_started_at    TIMESTAMPTZ,
    reserved_slots_count INTEGER    DEFAULT 0,
    note                TEXT,
    PRIMARY KEY (doctor_id, hospital_id, session_date)
);

-- 9. DOCTOR_HOSPITALS — links doctors to registered hospitals (for hospital admin roster)
CREATE TABLE IF NOT EXISTS public.doctor_hospitals (
    doctor_id   UUID        REFERENCES public.profiles(id) ON DELETE CASCADE,
    hospital_id UUID        REFERENCES public.hospitals(id) ON DELETE CASCADE,
    branch_id   UUID        REFERENCES public.hospital_branches(id) ON DELETE SET NULL,
    sector_id   UUID        REFERENCES public.hospital_sectors(id)  ON DELETE SET NULL,
    is_active   BOOLEAN     DEFAULT TRUE,
    joined_at   TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (doctor_id, hospital_id)
);

-- 10. REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id      UUID        REFERENCES public.profiles(id) ON DELETE CASCADE,
    doctor_id       UUID        REFERENCES public.profiles(id) ON DELETE CASCADE,
    appointment_id  UUID        REFERENCES public.appointments(id) ON DELETE SET NULL,
    rating          SMALLINT    NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment         TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (patient_id, doctor_id, appointment_id)
);

-- 11. MEDICINES — master catalog (managed by super admin)
CREATE TABLE IF NOT EXISTS public.medicines (
    id              UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT    NOT NULL,
    generic_name    TEXT,
    category        TEXT    NOT NULL DEFAULT 'General',
    form            TEXT    NOT NULL DEFAULT 'Tablet',
    strength        TEXT,
    manufacturer    TEXT
);

-- 12. USER_MEDICINES — patient self-tracked medicines
CREATE TABLE IF NOT EXISTS public.user_medicines (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id      TEXT        NOT NULL,
    medicine_name   TEXT        NOT NULL,
    dosage          TEXT,
    duration_days   INTEGER,
    start_date      DATE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 13. EMAIL_OTPS
CREATE TABLE IF NOT EXISTS public.email_otps (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    email       TEXT        NOT NULL,
    otp_code    TEXT        NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    verified    BOOLEAN     DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 14. LOGIN_ATTEMPTS — rate limiting
CREATE TABLE IF NOT EXISTS public.login_attempts (
    identifier      TEXT        PRIMARY KEY,
    failed_attempts INTEGER     DEFAULT 0,
    lockout_until   TIMESTAMPTZ,
    last_attempt_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. AUDIT_LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name  TEXT        NOT NULL,
    record_id   TEXT        NOT NULL,
    action      TEXT        NOT NULL,
    changed_by  TEXT,
    old_data    JSONB,
    new_data    JSONB,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 16. SYSTEM_SETTINGS
CREATE TABLE IF NOT EXISTS public.system_settings (
    key     TEXT    PRIMARY KEY,
    value   JSONB   NOT NULL
);


-- ==============================================================================
-- INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_appointments_queue    ON public.appointments (doctor_id, appointment_date, serial_number);
CREATE INDEX IF NOT EXISTS idx_appointments_patient  ON public.appointments (patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON public.prescriptions (patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor  ON public.prescriptions (doctor_id);
CREATE INDEX IF NOT EXISTS idx_chambers_doctor       ON public.chambers (doctor_id);
CREATE INDEX IF NOT EXISTS idx_chambers_hospital     ON public.chambers (linked_hospital_id);
CREATE INDEX IF NOT EXISTS idx_hospitals_owner       ON public.hospitals (owner_id);
CREATE INDEX IF NOT EXISTS idx_doctor_hospitals_hosp ON public.doctor_hospitals (hospital_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role         ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_reg_status   ON public.profiles (registration_status);


-- ==============================================================================
-- ROW LEVEL SECURITY
-- App uses custom bcrypt auth (not Supabase JWT) so auth.uid() is always null.
-- All authorization is enforced in TypeScript. RLS is open here.
-- ==============================================================================
ALTER TABLE public.profiles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitals              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_branches      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_sectors       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chamber_requests       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chambers               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_sessions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_hospitals       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_medicines         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_otps             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings        ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies first, then create open ones
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT schemaname, tablename, policyname
             FROM pg_policies WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE POLICY "open" ON public.profiles               FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON public.hospitals              FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON public.hospital_branches      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON public.hospital_sectors       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON public.chamber_requests       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON public.chambers               FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON public.schedules              FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON public.appointments           FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON public.prescriptions          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON public.prescription_medicines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON public.queue_sessions         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON public.doctor_hospitals       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON public.reviews                FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON public.medicines              FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON public.user_medicines         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON public.email_otps             FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON public.login_attempts         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON public.audit_logs             FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON public.system_settings        FOR ALL USING (true) WITH CHECK (true);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;


-- ==============================================================================
-- FUNCTIONS
-- ==============================================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at  ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

DROP TRIGGER IF EXISTS trg_hospitals_updated_at ON public.hospitals;
CREATE TRIGGER trg_hospitals_updated_at
    BEFORE UPDATE ON public.hospitals
    FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


-- Rate limiting: is account locked?
CREATE OR REPLACE FUNCTION public.check_is_locked(p_identifier TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_lockout_until TIMESTAMPTZ;
BEGIN
    SELECT lockout_until INTO v_lockout_until
    FROM public.login_attempts WHERE identifier = p_identifier;
    RETURN (v_lockout_until IS NOT NULL AND v_lockout_until > NOW());
END;
$$;

-- Rate limiting: record attempt
CREATE OR REPLACE FUNCTION public.record_login_attempt(p_identifier TEXT, p_success BOOLEAN)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF p_success THEN
        DELETE FROM public.login_attempts WHERE identifier = p_identifier;
    ELSE
        INSERT INTO public.login_attempts (identifier, failed_attempts, last_attempt_at)
        VALUES (p_identifier, 1, NOW())
        ON CONFLICT (identifier) DO UPDATE
        SET
            failed_attempts = login_attempts.failed_attempts + 1,
            last_attempt_at = NOW(),
            lockout_until   = CASE
                WHEN login_attempts.failed_attempts + 1 >= 5
                THEN NOW() + INTERVAL '15 minutes'
                ELSE NULL
            END;
    END IF;
END;
$$;

-- Email OTP verification
CREATE OR REPLACE FUNCTION public.verify_email_otp(p_email TEXT, p_code TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_row public.email_otps%ROWTYPE;
BEGIN
    SELECT * INTO v_row
    FROM public.email_otps
    WHERE email = p_email
      AND otp_code = p_code
      AND verified = FALSE
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_row.id IS NULL THEN
        RETURN FALSE;
    END IF;

    UPDATE public.email_otps SET verified = TRUE WHERE id = v_row.id;
    RETURN TRUE;
END;
$$;


-- ==============================================================================
-- SEED DATA
-- ==============================================================================

-- ── SUPER ADMIN  (superadmin@dococlock.com / SuperAdmin@2026) ─────────────────
INSERT INTO public.profiles (full_name, email, role, password, registration_status)
VALUES (
    'System Administrator',
    'superadmin@dococlock.com',
    'SUPER_ADMIN',
    '$2b$10$DEQeQAy1H6omTeQ4m.B8RejWasAshhY1eWFfZIEOtn4qzvFqMmemm',
    'approved'
) ON CONFLICT (email) DO NOTHING;

-- ── HOSPITAL ADMIN  (hospital@dococlock.com / HospitalAdmin@2026) ─────────────
INSERT INTO public.profiles (full_name, email, role, password, registration_status)
VALUES (
    'Hospital Administrator',
    'hospital@dococlock.com',
    'HOSPITAL_ADMIN',
    '$2b$10$DEQeQAy1H6omTeQ4m.B8ReQ5E2tBWiJgO0rUUx7txG6YZffr4ULVG',
    'approved'
) ON CONFLICT (email) DO NOTHING;

-- ── SAMPLE HOSPITAL owned by hospital admin ────────────────────────────────────
DO $$
DECLARE v_admin_id UUID;
BEGIN
    SELECT id INTO v_admin_id FROM public.profiles WHERE email = 'hospital@dococlock.com' LIMIT 1;
    IF v_admin_id IS NOT NULL THEN
        INSERT INTO public.hospitals (name, address, contact_info, owner_id)
        VALUES ('DocOclock Central Hospital', '123 Medical Avenue, Dhaka 1205', '+880-1700-000000', v_admin_id)
        ON CONFLICT DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ── DEMO DOCTORS  (password: 123456) ──────────────────────────────────────────
INSERT INTO public.profiles (
    id, full_name, role, specialty, degrees, age, gender,
    experience_years, total_patients, rating, about, image_url,
    password, registration_status, bmdc_number
) VALUES
(
    'efcafe7e-aa11-4822-a123-4b1aec2ad2ff',
    'Dr. Sarah Rahman', 'DOCTOR', 'Cardiology', 'MBBS, FCPS (Cardiology)',
    42, 'Female', 15, 3200, 4.9,
    'Specialist in Interventional Cardiology with over 15 years of experience.',
    'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=200&h=200',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'approved', 'BMDC-2001-SR'
),(
    'bc2d3e4f-5678-90ab-cdef-123456789012',
    'Dr. Ariful Islam', 'DOCTOR', 'Neurology', 'MBBS, MD (Neurology)',
    38, 'Male', 10, 2100, 4.8,
    'Expert in treating complex neurological disorders including stroke and epilepsy.',
    'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200&h=200',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'approved', 'BMDC-2004-AI'
),(
    'de3f4a5b-6789-01bc-def0-234567890123',
    'Dr. Nusrat Jahan', 'DOCTOR', 'Pediatrics', 'MBBS, DCH',
    35, 'Female', 8, 1500, 4.7,
    'Dedicated to comprehensive healthcare for children from newborn to adolescent.',
    'https://images.unsplash.com/photo-1559839734-2b71f1536783?auto=format&fit=crop&q=80&w=200&h=200',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'approved', 'BMDC-2006-NJ'
) ON CONFLICT (id) DO NOTHING;

-- ── DEMO CHAMBERS ─────────────────────────────────────────────────────────────
INSERT INTO public.chambers (id, doctor_id, hospital_name, address, consultation_fee, daily_booking_limit) VALUES
('c1cafe7e-aa11-4822-a123-4b1aec2ad2ff', 'efcafe7e-aa11-4822-a123-4b1aec2ad2ff', 'Evercare Hospital',  'Plot 81, Block E, Bashundhara R/A, Dhaka', 1000, 30),
('c2cafe7e-aa11-4822-a123-4b1aec2ad2ff', 'bc2d3e4f-5678-90ab-cdef-123456789012', 'Square Hospital',    '18/F, West Panthapath, Dhaka',             1200, 25),
('c3cafe7e-aa11-4822-a123-4b1aec2ad2ff', 'de3f4a5b-6789-01bc-def0-234567890123', 'United Hospital',    'Plot 15, Road 71, Gulshan, Dhaka',          800,  30)
ON CONFLICT (id) DO NOTHING;

-- ── DEMO SCHEDULES ────────────────────────────────────────────────────────────
INSERT INTO public.schedules (chamber_id, day_of_week, start_time, end_time, max_patients) VALUES
('c1cafe7e-aa11-4822-a123-4b1aec2ad2ff', 'Sunday',    '17:00', '21:00', 30),
('c1cafe7e-aa11-4822-a123-4b1aec2ad2ff', 'Monday',    '17:00', '21:00', 30),
('c1cafe7e-aa11-4822-a123-4b1aec2ad2ff', 'Tuesday',   '17:00', '21:00', 30),
('c1cafe7e-aa11-4822-a123-4b1aec2ad2ff', 'Wednesday', '17:00', '21:00', 30),
('c1cafe7e-aa11-4822-a123-4b1aec2ad2ff', 'Thursday',  '17:00', '21:00', 30),
('c2cafe7e-aa11-4822-a123-4b1aec2ad2ff', 'Saturday',  '10:00', '14:00', 20),
('c2cafe7e-aa11-4822-a123-4b1aec2ad2ff', 'Monday',    '10:00', '14:00', 20),
('c2cafe7e-aa11-4822-a123-4b1aec2ad2ff', 'Wednesday', '10:00', '14:00', 20),
('c3cafe7e-aa11-4822-a123-4b1aec2ad2ff', 'Sunday',    '18:00', '21:00', 25),
('c3cafe7e-aa11-4822-a123-4b1aec2ad2ff', 'Tuesday',   '18:00', '21:00', 25),
('c3cafe7e-aa11-4822-a123-4b1aec2ad2ff', 'Thursday',  '18:00', '21:00', 25)
ON CONFLICT DO NOTHING;

-- ── MEDICINES CATALOG ─────────────────────────────────────────────────────────
INSERT INTO public.medicines (name, generic_name, category, form, strength, manufacturer) VALUES
('Napa',         'Paracetamol',           'Analgesic',        'Tablet',  '500mg',    'Beximco Pharma'),
('Napa Extra',   'Paracetamol+Caffeine',  'Analgesic',        'Tablet',  '500/65mg', 'Beximco Pharma'),
('Ace',          'Paracetamol',           'Analgesic',        'Tablet',  '500mg',    'Square Pharma'),
('Napa Syrup',   'Paracetamol',           'Analgesic',        'Syrup',   '120mg/5ml','Beximco Pharma'),
('Amoxi',        'Amoxicillin',           'Antibiotic',       'Capsule', '500mg',    'Square Pharma'),
('Azithro',      'Azithromycin',          'Antibiotic',       'Tablet',  '500mg',    'Incepta Pharma'),
('Ciprofloxacin','Ciprofloxacin',         'Antibiotic',       'Tablet',  '500mg',    'General'),
('Clav',         'Amoxicillin+Clavulanic','Antibiotic',       'Tablet',  '625mg',    'Square Pharma'),
('Seclo',        'Omeprazole',            'Antacid/PPI',      'Capsule', '20mg',     'Square Pharma'),
('Pantonix',     'Pantoprazole',          'Antacid/PPI',      'Tablet',  '40mg',     'Incepta Pharma'),
('Alatrol',      'Cetirizine',            'Antihistamine',    'Tablet',  '10mg',     'Square Pharma'),
('Fexo',         'Fexofenadine',          'Antihistamine',    'Tablet',  '120mg',    'Incepta Pharma'),
('Losartan',     'Losartan Potassium',    'Antihypertensive', 'Tablet',  '50mg',     'General'),
('Amlodipine',   'Amlodipine',            'Antihypertensive', 'Tablet',  '5mg',      'General'),
('Metformin',    'Metformin HCl',         'Antidiabetic',     'Tablet',  '500mg',    'General'),
('Glimepride',   'Glimepiride',           'Antidiabetic',     'Tablet',  '2mg',      'General'),
('Atorin',       'Atorvastatin',          'Statin',           'Tablet',  '10mg',     'Square Pharma'),
('Calplex',      'Calcium+Vitamin D3',    'Supplement',       'Tablet',  '500mg',    'Incepta Pharma'),
('Salbutamol',   'Salbutamol',            'Bronchodilator',   'Inhaler', '100mcg',   'General'),
('Montek',       'Montelukast',           'Antiasthmatic',    'Tablet',  '10mg',     'Incepta Pharma'),
('Fluconazole',  'Fluconazole',           'Antifungal',       'Capsule', '150mg',    'General'),
('Prednisolone', 'Prednisolone',          'Corticosteroid',   'Tablet',  '5mg',      'General'),
('Diclofenac',   'Diclofenac Sodium',     'NSAID',            'Tablet',  '50mg',     'General'),
('Zincovit',     'Zinc+Multivitamin',     'Supplement',       'Tablet',  '22mg',     'General'),
('Esomep',       'Esomeprazole',          'Antacid/PPI',      'Capsule', '20mg',     'Beximco Pharma')
ON CONFLICT DO NOTHING;

-- ── SYSTEM SETTINGS ───────────────────────────────────────────────────────────
INSERT INTO public.system_settings (key, value) VALUES
('location_search_enabled', 'false'::jsonb),
('max_booking_days_ahead',  '30'::jsonb),
('platform_name',           '"DocOclock"'::jsonb)
ON CONFLICT (key) DO NOTHING;


-- ==============================================================================
-- VERIFY
-- SELECT id, full_name, email, role FROM profiles;
-- SELECT COUNT(*) FROM medicines;
-- SELECT * FROM system_settings;
-- ==============================================================================
