-- ==============================================================================
-- ⚠️  NUCLEAR RLS RESET — RUN THIS FIRST, BEFORE ANYTHING ELSE
-- This drops EVERY policy on EVERY table, then creates clean ones.
-- Copy-paste this ENTIRE file into Supabase SQL Editor and click "Run".
-- ==============================================================================

-- STEP 1: Drop ALL policies on ALL public tables
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
    RAISE NOTICE '✅ All existing policies dropped.';
END;
$$ LANGUAGE plpgsql;


-- STEP 2: Make sure RLS is enabled on all tables
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.doctor_hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.prescription_medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.queue_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chambers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;


-- STEP 3: Create new clean policies
-- Since this app uses CUSTOM bcrypt auth (not GoTrue), auth.uid() is ALWAYS null.
-- We use permissive read/write + enforce role restrictions at INSERT level.

-- ── PROFILES ──────────────────────────────────────────────────
-- Only PATIENT and DOCTOR can be created via the API (signup).
-- SUPER_ADMIN and HOSPITAL_ADMIN can only be created via SQL.
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (role IN ('PATIENT', 'DOCTOR'));
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (true);

-- ── HOSPITALS ──────────────────────────────────────────────────
CREATE POLICY "hospitals_select" ON public.hospitals FOR SELECT USING (true);
CREATE POLICY "hospitals_insert" ON public.hospitals FOR INSERT WITH CHECK (true);
CREATE POLICY "hospitals_update" ON public.hospitals FOR UPDATE USING (true);

-- ── DOCTOR_HOSPITALS ──────────────────────────────────────────
CREATE POLICY "dh_select" ON public.doctor_hospitals FOR SELECT USING (true);
CREATE POLICY "dh_insert" ON public.doctor_hospitals FOR INSERT WITH CHECK (true);
CREATE POLICY "dh_delete" ON public.doctor_hospitals FOR DELETE USING (true);

-- ── APPOINTMENTS ──────────────────────────────────────────────
CREATE POLICY "appts_select" ON public.appointments FOR SELECT USING (true);
CREATE POLICY "appts_insert" ON public.appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "appts_update" ON public.appointments FOR UPDATE USING (true);

-- ── PRESCRIPTIONS ─────────────────────────────────────────────
CREATE POLICY "rx_select" ON public.prescriptions FOR SELECT USING (true);
CREATE POLICY "rx_insert" ON public.prescriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "rx_update" ON public.prescriptions FOR UPDATE USING (true);

-- ── PRESCRIPTION MEDICINES ────────────────────────────────────
CREATE POLICY "rxmed_select" ON public.prescription_medicines FOR SELECT USING (true);
CREATE POLICY "rxmed_insert" ON public.prescription_medicines FOR INSERT WITH CHECK (true);

-- ── REVIEWS ───────────────────────────────────────────────────
CREATE POLICY "reviews_select" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert" ON public.reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "reviews_update" ON public.reviews FOR UPDATE USING (true);

-- ── SCHEDULES / QUEUES / CHAMBERS ─────────────────────────────
CREATE POLICY "sched_all" ON public.schedules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "queue_all" ON public.queue_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "chambers_all" ON public.chambers FOR ALL USING (true) WITH CHECK (true);

-- ── LOGIN ATTEMPTS ────────────────────────────────────────────
CREATE POLICY "login_all" ON public.login_attempts FOR ALL USING (true) WITH CHECK (true);

-- ── AUDIT LOGS ────────────────────────────────────────────────
CREATE POLICY "audit_select" ON public.audit_logs FOR SELECT USING (true);


-- STEP 4: Grants
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;


-- ==============================================================================
-- STEP 5: EMAIL OTP TABLE (for signup verification)
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
CREATE POLICY "otp_all" ON public.email_otps FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON public.email_otps TO anon, authenticated;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_email_otps_email ON public.email_otps(email, otp_code, expires_at);

-- Cleanup function: delete expired OTPs (run periodically or on each verify)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM public.email_otps WHERE expires_at < NOW();
END;
$$;

-- Verify OTP function
CREATE OR REPLACE FUNCTION verify_email_otp(p_email TEXT, p_code TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE
  is_valid BOOLEAN;
BEGIN
  -- Cleanup expired first
  PERFORM cleanup_expired_otps();
  
  -- Check if valid unexpired OTP exists
  SELECT EXISTS(
    SELECT 1 FROM public.email_otps 
    WHERE email = p_email 
    AND otp_code = p_code 
    AND expires_at > NOW() 
    AND verified = false
  ) INTO is_valid;
  
  IF is_valid THEN
    -- Mark as verified
    UPDATE public.email_otps SET verified = true 
    WHERE email = p_email AND otp_code = p_code;
  END IF;
  
  RETURN is_valid;
END;
$$;

-- Grant execute to anon
GRANT EXECUTE ON FUNCTION verify_email_otp(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_otps() TO anon, authenticated;


-- ╔══════════════════════════════════════════════════════════════╗
-- ║  VERIFICATION: Run these after to confirm everything works   ║
-- ╚══════════════════════════════════════════════════════════════╝
-- SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;
-- SELECT count(*) FROM pg_policies WHERE schemaname = 'public';
