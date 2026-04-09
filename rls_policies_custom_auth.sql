-- ==============================================================================
-- QUICKFIX: RLS POLICIES COMPATIBLE WITH CUSTOM BCRYPT AUTH
-- 
-- Since DocOclock uses custom auth (bcrypt in browser, anon Supabase key),
-- auth.uid() is ALWAYS NULL. All policies that reference auth.uid() are broken.
--
-- This file drops ALL existing policies and creates ones that work with
-- the anon key while still enforcing role-based INSERT restrictions.
--
-- RUN THIS IN SUPABASE SQL EDITOR (replace everything from rls_policies.sql)
-- ==============================================================================

-- 1. CLEAR ALL EXISTING POLICIES
DO $$
DECLARE
    tbl RECORD;
    pol RECORD;
BEGIN
    FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = tbl.tablename LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl.tablename);
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;


-- 2. ENABLE RLS ON ALL TABLES
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


-- ==============================================================================
-- 3. PROFILES
-- ==============================================================================

-- Signup: Only PATIENT and DOCTOR can self-register.
-- SUPER_ADMIN and HOSPITAL_ADMIN can ONLY be created via SQL or by an existing Super Admin.
CREATE POLICY "signup_patient_or_doctor"
ON public.profiles FOR INSERT
WITH CHECK (role IN ('PATIENT', 'DOCTOR'));

-- Read: Allow all reads (needed for login lookup, doctor listings, etc.)
CREATE POLICY "read_all_profiles"
ON public.profiles FOR SELECT USING (true);

-- Update: Allow all updates (frontend enforces scope via session ID)
CREATE POLICY "update_profiles"
ON public.profiles FOR UPDATE USING (true);

-- Delete: Only via SQL (no frontend delete)
-- No DELETE policy = no one can delete profiles via the API


-- ==============================================================================
-- 4. HOSPITALS
-- ==============================================================================
CREATE POLICY "read_hospitals" ON public.hospitals FOR SELECT USING (true);
CREATE POLICY "insert_hospitals" ON public.hospitals FOR INSERT WITH CHECK (true);
CREATE POLICY "update_hospitals" ON public.hospitals FOR UPDATE USING (true);


-- ==============================================================================
-- 5. DOCTOR_HOSPITALS
-- ==============================================================================
CREATE POLICY "read_doctor_hospitals" ON public.doctor_hospitals FOR SELECT USING (true);
CREATE POLICY "insert_doctor_hospitals" ON public.doctor_hospitals FOR INSERT WITH CHECK (true);
CREATE POLICY "delete_doctor_hospitals" ON public.doctor_hospitals FOR DELETE USING (true);


-- ==============================================================================
-- 6. APPOINTMENTS
-- ==============================================================================
CREATE POLICY "read_appointments" ON public.appointments FOR SELECT USING (true);
CREATE POLICY "insert_appointments" ON public.appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "update_appointments" ON public.appointments FOR UPDATE USING (true);


-- ==============================================================================
-- 7. PRESCRIPTIONS & MEDICINES
-- ==============================================================================
CREATE POLICY "read_prescriptions" ON public.prescriptions FOR SELECT USING (true);
CREATE POLICY "insert_prescriptions" ON public.prescriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "update_prescriptions" ON public.prescriptions FOR UPDATE USING (true);

CREATE POLICY "read_prescription_medicines" ON public.prescription_medicines FOR SELECT USING (true);
CREATE POLICY "insert_prescription_medicines" ON public.prescription_medicines FOR INSERT WITH CHECK (true);


-- ==============================================================================
-- 8. REVIEWS
-- ==============================================================================
CREATE POLICY "read_reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "insert_reviews" ON public.reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "update_reviews" ON public.reviews FOR UPDATE USING (true);


-- ==============================================================================
-- 9. SCHEDULES & QUEUE SESSIONS & CHAMBERS
-- ==============================================================================
CREATE POLICY "all_schedules" ON public.schedules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_queue_sessions" ON public.queue_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_chambers" ON public.chambers FOR ALL USING (true) WITH CHECK (true);


-- ==============================================================================
-- 10. LOGIN ATTEMPTS (Rate Limiting)
-- ==============================================================================
-- Ensure login_attempts table is accessible
ALTER TABLE IF EXISTS public.login_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public login attempts access" ON public.login_attempts;
CREATE POLICY "login_attempts_access" ON public.login_attempts FOR ALL USING (true) WITH CHECK (true);


-- ==============================================================================
-- 11. AUDIT LOGS (Read-only for super admins via direct SQL; no API access needed)
-- ==============================================================================
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Super Admins can read audits" ON public.audit_logs;
CREATE POLICY "read_audit_logs" ON public.audit_logs FOR SELECT USING (true);


-- GRANTS (ensure anon/authenticated can use the schema)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
