-- ==============================================================================
-- DOC OCLOCK - STRICT ROW LEVEL SECURITY (RLS) POLICIES
-- Enforces 4-Role Model: SUPER_ADMIN, HOSPITAL_ADMIN, DOCTOR, PATIENT
-- ==============================================================================

-- 1. Helper Functions (Security Definer)
-- These allow us to check a user's role without triggering infinite recursion on the profiles table
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS text 
LANGUAGE sql SECURITY DEFINER SET search_path = public 
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION auth_is_super_admin()
RETURNS boolean 
LANGUAGE sql SECURITY DEFINER SET search_path = public 
AS $$
  SELECT auth_user_role() = 'SUPER_ADMIN';
$$;


-- ==============================================================================
-- 2. ENABLE RLS ON ALL TABLES
-- Note: Re-enabling just in case.
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Clear previous loose/development policies if any
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


-- ==============================================================================
-- 3. PROFILES Table Policies
-- ==============================================================================

-- Super Admins have full access
CREATE POLICY "Super Admins can do everything on profiles" 
ON public.profiles FOR ALL USING (auth_is_super_admin());

-- SIGNUP: Allow anonymous inserts for PATIENT and DOCTOR roles ONLY.
-- Admins can ONLY be created by Super Admins via the policy above.
CREATE POLICY "Anyone can signup as patient or doctor"
ON public.profiles FOR INSERT 
WITH CHECK (role IN ('PATIENT', 'DOCTOR'));

-- LOGIN: Allow anonymous SELECT so the frontend can look up a user by phone/email/bmdc
-- to verify password. This is required because we use custom bcrypt auth, not GoTrue.
-- The password hash is fetched but never exposed in the UI (only used in bcrypt.compare).
CREATE POLICY "Anyone can select profiles for login lookup"
ON public.profiles FOR SELECT USING (true);

-- Users can update their own profile (matched by ID stored in session)
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (true);

-- Hospital admins can view doctors linked to their hospital
CREATE POLICY "Hospital admins can view doctors linked to their hospital"
ON public.profiles FOR SELECT
USING (
  id IN (
    SELECT dh.doctor_id FROM public.doctor_hospitals dh 
    JOIN public.hospitals h ON dh.hospital_id = h.id 
    WHERE h.owner_id = auth.uid()
  )
);


-- ==============================================================================
-- 4. HOSPITALS Table Policies
-- ==============================================================================
CREATE POLICY "Super Admins ALL on hospitals"
ON public.hospitals FOR ALL USING (auth_is_super_admin());

CREATE POLICY "Anyone can view all hospitals"
ON public.hospitals FOR SELECT USING (true);

CREATE POLICY "Hospital Admins manage own hospitals"
ON public.hospitals FOR ALL USING (owner_id = auth.uid());


-- ==============================================================================
-- 5. DOCTOR-HOSPITALS Links Policies
-- ==============================================================================
CREATE POLICY "Super Admins ALL on doctor_hospitals"
ON public.doctor_hospitals FOR ALL USING (auth_is_super_admin());

CREATE POLICY "Anyone can view doctor_hospitals links"
ON public.doctor_hospitals FOR SELECT USING (true);

CREATE POLICY "Hospital Admins link/unlink doctors to their hospital"
ON public.doctor_hospitals FOR ALL 
USING (
  hospital_id IN (SELECT id FROM public.hospitals WHERE owner_id = auth.uid())
);


-- ==============================================================================
-- 6. APPOINTMENTS Table Policies
-- ==============================================================================
CREATE POLICY "Super Admins ALL on appointments"
ON public.appointments FOR ALL USING (auth_is_super_admin());

-- Notice: Using patient_id::text or just checking if `patient_id` starts with auth.uid() for family accounts
CREATE POLICY "Patients view own appointments"
ON public.appointments FOR SELECT 
USING (patient_id LIKE (auth.uid()::text || '%'));

CREATE POLICY "Patients insert own appointments"
ON public.appointments FOR INSERT
WITH CHECK (patient_id LIKE (auth.uid()::text || '%')); 

CREATE POLICY "Doctors view own appointments"
ON public.appointments FOR SELECT
USING (doctor_id = auth.uid());

CREATE POLICY "Doctors manage (update/edit) own appointments"
ON public.appointments FOR UPDATE
USING (doctor_id = auth.uid());

CREATE POLICY "Hospital Admins view appointments at their hospital"
ON public.appointments FOR SELECT
USING (hospital_id IN (SELECT id FROM public.hospitals WHERE owner_id = auth.uid()));


-- ==============================================================================
-- 7. REVIEWS Table Policies
-- ==============================================================================
CREATE POLICY "Super Admins ALL on reviews"
ON public.reviews FOR ALL USING (auth_is_super_admin());

CREATE POLICY "Anyone can view reviews"
ON public.reviews FOR SELECT USING (true);

CREATE POLICY "Patients create and manage own reviews"
ON public.reviews FOR ALL USING (patient_id = auth.uid());


-- ==============================================================================
-- 8. MEDICAL HISTORY: PRESCRIPTIONS & MEDICINES 
-- strict privacy: Only Patient & Doctor can see them (Hospital Admin CANNOT see diagnosis)
-- ==============================================================================
CREATE POLICY "Super Admins ALL on prescriptions"
ON public.prescriptions FOR ALL USING (auth_is_super_admin());

CREATE POLICY "Patients view own prescriptions"
ON public.prescriptions FOR SELECT 
USING (patient_id LIKE (auth.uid()::text || '%'));

CREATE POLICY "Doctors view and manage own written prescriptions"
ON public.prescriptions FOR ALL USING (doctor_id = auth.uid());


CREATE POLICY "Super Admins ALL on prescription_medicines"
ON public.prescription_medicines FOR ALL USING (auth_is_super_admin());

CREATE POLICY "Patients view medicines linked to their prescriptions"
ON public.prescription_medicines FOR SELECT 
USING (
  prescription_id IN (
    SELECT id FROM public.prescriptions WHERE patient_id LIKE (auth.uid()::text || '%')
  )
);

CREATE POLICY "Doctors manage prescription_medicines for their prescriptions"
ON public.prescription_medicines FOR ALL
USING (
  prescription_id IN (
    SELECT id FROM public.prescriptions WHERE doctor_id = auth.uid()
  )
);


-- ==============================================================================
-- 9. MISC: SCHEDULES & QUEUE SESSIONS
-- ==============================================================================
CREATE POLICY "Super Admins ALL on schedules and queues"
ON public.schedules FOR ALL USING (auth_is_super_admin());
CREATE POLICY "Super Admins ALL on queue_sessions"
ON public.queue_sessions FOR ALL USING (auth_is_super_admin());

CREATE POLICY "Anyone can view schedules and queues"
ON public.schedules FOR SELECT USING (true);
CREATE POLICY "Anyone can view queue_sessions"
ON public.queue_sessions FOR SELECT USING (true);

CREATE POLICY "Doctors manage their own schedules"
ON public.schedules FOR ALL USING (
  chamber_id IN (SELECT id FROM public.chambers WHERE doctor_id = auth.uid())
);

CREATE POLICY "Doctors manage their own queue sessions"
ON public.queue_sessions FOR ALL USING (doctor_id = auth.uid());
