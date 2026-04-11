-- ==============================================================================
-- ⚠️  FINAL NUCLEAR FIX — COPY THIS ENTIRE FILE INTO SUPABASE SQL EDITOR
-- ==============================================================================

-- 1. DISABLE RLS temporarily to drop everything cleanly
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hospitals DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.doctor_hospitals DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.prescriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.prescription_medicines DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.queue_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chambers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.login_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs DISABLE ROW LEVEL SECURITY;

-- 2. DROP every single policy
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public')
    LOOP EXECUTE format('DROP POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 3. RE-ENABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chambers ENABLE ROW LEVEL SECURITY;

-- 4. SIMPLEST POSSIBLE POLICIES — guaranteed to work with anon key
CREATE POLICY "p_profiles_insert" ON public.profiles FOR INSERT TO anon, authenticated WITH CHECK (role IN ('PATIENT', 'DOCTOR'));
CREATE POLICY "p_profiles_select" ON public.profiles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "p_profiles_update" ON public.profiles FOR UPDATE TO anon, authenticated USING (true);

CREATE POLICY "p_hospitals_all" ON public.hospitals FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "p_dh_all" ON public.doctor_hospitals FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "p_appts_all" ON public.appointments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "p_rx_all" ON public.prescriptions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "p_rxmed_all" ON public.prescription_medicines FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "p_reviews_all" ON public.reviews FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "p_sched_all" ON public.schedules FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "p_queue_all" ON public.queue_sessions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "p_chambers_all" ON public.chambers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Login attempts & audit logs
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL,
  success BOOLEAN DEFAULT false,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "p_login_all" ON public.login_attempts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Rate Limiting Functions
CREATE OR REPLACE FUNCTION check_is_locked(p_identifier TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE failures INT;
BEGIN
  SELECT COUNT(*) INTO failures FROM public.login_attempts 
  WHERE identifier = p_identifier AND success = false AND created_at > NOW() - INTERVAL '15 minutes';
  RETURN failures >= 5;
END;
$$;
GRANT EXECUTE ON FUNCTION check_is_locked(TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION record_login_attempt(p_identifier TEXT, p_success BOOLEAN)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.login_attempts(identifier, success) VALUES (p_identifier, p_success);
END;
$$;
GRANT EXECUTE ON FUNCTION record_login_attempt(TEXT, BOOLEAN) TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  user_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "p_audit_all" ON public.audit_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 5. GRANTS — belt and suspenders
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;


-- ==============================================================================
-- 6. EMAIL OTP TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.email_otps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.email_otps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "p_otp_all" ON public.email_otps FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
GRANT ALL ON public.email_otps TO anon, authenticated;
CREATE INDEX IF NOT EXISTS idx_email_otps_lookup ON public.email_otps(email, otp_code);

-- Verify OTP function
CREATE OR REPLACE FUNCTION verify_email_otp(p_email TEXT, p_code TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE is_valid BOOLEAN;
BEGIN
  DELETE FROM public.email_otps WHERE expires_at < NOW();
  SELECT EXISTS(SELECT 1 FROM public.email_otps WHERE email = p_email AND otp_code = p_code AND expires_at > NOW() AND verified = false) INTO is_valid;
  IF is_valid THEN UPDATE public.email_otps SET verified = true WHERE email = p_email AND otp_code = p_code; END IF;
  RETURN is_valid;
END;
$$;
GRANT EXECUTE ON FUNCTION verify_email_otp(TEXT, TEXT) TO anon, authenticated;


-- ==============================================================================
-- 7. MEDICINES CATALOG TABLE (Super Admin managed)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.medicines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  generic_name TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  form TEXT DEFAULT 'Tablet',
  strength TEXT,
  manufacturer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "p_medicines_all" ON public.medicines FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
GRANT ALL ON public.medicines TO anon, authenticated;
CREATE INDEX IF NOT EXISTS idx_medicines_name ON public.medicines(name);
CREATE INDEX IF NOT EXISTS idx_medicines_category ON public.medicines(category);

-- Add email column to profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='email') THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT;
  END IF;
END $$;

-- ==============================================================================
-- 7.5 SYSTEM SETTINGS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings are readable by everyone" ON public.system_settings FOR SELECT USING (true);
CREATE POLICY "Super Admins can update settings" ON public.system_settings FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
);
GRANT ALL ON public.system_settings TO anon, authenticated;

-- Pre-seed location setting
INSERT INTO public.system_settings (key, value) VALUES ('location_search_enabled', 'false'::jsonb) ON CONFLICT (key) DO NOTHING;



-- ==============================================================================
-- 8. SEED SUPER ADMIN (if not exists)
-- ==============================================================================
-- Password: SuperAdmin@2026
INSERT INTO public.profiles (full_name, email, role, password, registration_status, created_at)
SELECT 'System Administrator', 'superadmin@dococlock.com', 'SUPER_ADMIN', 
  '$2b$10$DEQeQAy1H6omTeQ4m.B8RejWasAshhY1eWFfZIEOtn4qzvFqMmemm', 'approved', NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'superadmin@dococlock.com');

-- Hospital Admin Password: HospitalAdmin@2026
INSERT INTO public.profiles (full_name, email, role, password, registration_status, created_at)
SELECT 'Hospital Administrator', 'hospital@dococlock.com', 'HOSPITAL_ADMIN',
  '$2b$10$DEQeQAy1H6omTeQ4m.B8ReQ5E2tBWiJgO0rUUx7txG6YZffr4ULVG', 'approved', NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'hospital@dococlock.com');

-- Link hospital admin to a hospital
DO $$
DECLARE admin_id UUID;
BEGIN
  SELECT id INTO admin_id FROM public.profiles WHERE email = 'hospital@dococlock.com' LIMIT 1;
  IF admin_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.hospitals WHERE owner_id = admin_id) THEN
    INSERT INTO public.hospitals (name, address, contact_info, owner_id) 
    VALUES ('DocOclock Central Hospital', '123 Medical Avenue, Dhaka 1205', '+880-1700-000000', admin_id);
  END IF;
END $$;


-- ==============================================================================
-- 9. SEED MEDICINE CATALOG (Common Bangladesh medicines)
-- ==============================================================================
INSERT INTO public.medicines (name, generic_name, category, form, strength, manufacturer) VALUES
-- Antibiotics
('Azithral 500', 'Azithromycin', 'Antibiotic', 'Tablet', '500mg', 'Square Pharmaceuticals'),
('Cef-3', 'Cefixime', 'Antibiotic', 'Tablet', '200mg', 'Square Pharmaceuticals'),
('Moxacil', 'Amoxicillin', 'Antibiotic', 'Capsule', '500mg', 'Beximco Pharma'),
('Ciprocin 500', 'Ciprofloxacin', 'Antibiotic', 'Tablet', '500mg', 'Square Pharmaceuticals'),
('Levoflox 500', 'Levofloxacin', 'Antibiotic', 'Tablet', '500mg', 'Incepta Pharma'),
('Metro 400', 'Metronidazole', 'Antibiotic', 'Tablet', '400mg', 'Square Pharmaceuticals'),
('Fluclox 500', 'Flucloxacillin', 'Antibiotic', 'Capsule', '500mg', 'Beximco Pharma'),
-- Pain & Fever
('Napa', 'Paracetamol', 'Analgesic', 'Tablet', '500mg', 'Beximco Pharma'),
('Napa Extra', 'Paracetamol + Caffeine', 'Analgesic', 'Tablet', '500mg+65mg', 'Beximco Pharma'),
('Ace Plus', 'Paracetamol + Caffeine', 'Analgesic', 'Tablet', '500mg+65mg', 'Square Pharmaceuticals'),
('Toradol', 'Ketorolac', 'NSAID', 'Tablet', '10mg', 'Square Pharmaceuticals'),
('Napro-A', 'Naproxen', 'NSAID', 'Tablet', '500mg', 'ACI Limited'),
('Fexo', 'Fexofenadine', 'Antihistamine', 'Tablet', '120mg', 'Square Pharmaceuticals'),
-- Gastric
('Seclo 20', 'Omeprazole', 'Antacid/PPI', 'Capsule', '20mg', 'Square Pharmaceuticals'),
('Pantonix 40', 'Pantoprazole', 'Antacid/PPI', 'Tablet', '40mg', 'Incepta Pharma'),
('Maxpro 20', 'Esomeprazole', 'Antacid/PPI', 'Capsule', '20mg', 'Renata Limited'),
('Antacid Plus', 'Al-Hydroxide+Mg-Hydroxide', 'Antacid', 'Suspension', '200ml', 'Square Pharmaceuticals'),
-- Diabetes
('Metform 500', 'Metformin', 'Antidiabetic', 'Tablet', '500mg', 'Square Pharmaceuticals'),
('Glim 2', 'Glimepiride', 'Antidiabetic', 'Tablet', '2mg', 'Incepta Pharma'),
('Novorapid', 'Insulin Aspart', 'Antidiabetic', 'Injection', '100IU/ml', 'Novo Nordisk'),
-- Cardiac
('Amlodip 5', 'Amlodipine', 'Antihypertensive', 'Tablet', '5mg', 'Square Pharmaceuticals'),
('Losartan 50', 'Losartan', 'Antihypertensive', 'Tablet', '50mg', 'Incepta Pharma'),
('Azor 5/40', 'Amlodipine+Olmesartan', 'Antihypertensive', 'Tablet', '5/40mg', 'Beximco Pharma'),
('Aspirin 75', 'Aspirin', 'Antiplatelet', 'Tablet', '75mg', 'Square Pharmaceuticals'),
('Atova 10', 'Atorvastatin', 'Statin', 'Tablet', '10mg', 'Incepta Pharma'),
-- Vitamins & Supplements
('Cal-D-Vita', 'Calcium + Vitamin D', 'Supplement', 'Tablet', '500mg+200IU', 'Square Pharmaceuticals'),
('Tocopherol E', 'Vitamin E', 'Supplement', 'Capsule', '400IU', 'ACI Limited'),
('Filwel Gold', 'Multivitamin', 'Supplement', 'Tablet', 'Multi', 'Square Pharmaceuticals'),
('Iron Folic', 'Ferrous Sulfate + Folic Acid', 'Supplement', 'Tablet', '200mg+5mg', 'Incepta Pharma'),
-- Respiratory
('Salmolin', 'Salbutamol', 'Bronchodilator', 'Inhaler', '100mcg', 'Square Pharmaceuticals'),
('Montas 10', 'Montelukast', 'Antiasthmatic', 'Tablet', '10mg', 'Incepta Pharma'),
('Brodil', 'Salbutamol', 'Bronchodilator', 'Syrup', '2mg/5ml', 'Beximco Pharma'),
-- Dermatology
('Ketocon', 'Ketoconazole', 'Antifungal', 'Cream', '2%', 'Square Pharmaceuticals'),
('Clobeta', 'Clobetasol', 'Corticosteroid', 'Cream', '0.05%', 'Incepta Pharma'),
-- Mental Health
('Seralin 50', 'Sertraline', 'Antidepressant', 'Tablet', '50mg', 'Incepta Pharma'),
('Anxinil 0.5', 'Clonazepam', 'Anxiolytic', 'Tablet', '0.5mg', 'Square Pharmaceuticals')
ON CONFLICT DO NOTHING;


-- DONE! Verify:
SELECT 'POLICIES:' as info, count(*) as total FROM pg_policies WHERE schemaname = 'public';
SELECT 'MEDICINES:' as info, count(*) as total FROM public.medicines;
SELECT 'ADMINS:' as info, count(*) as total FROM public.profiles WHERE role IN ('SUPER_ADMIN', 'HOSPITAL_ADMIN');
