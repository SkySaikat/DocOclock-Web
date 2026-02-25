-- FINAL DOCTOR SIGNUP & CHAMBER SYNC FIX
-- Run this in your Supabase SQL Editor to resolve "daily_booking_limit" errors and fix Signup permissions.

-- 1. Add missing columns to Chambers
ALTER TABLE public.chambers ADD COLUMN IF NOT EXISTS daily_booking_limit INTEGER DEFAULT 30;
ALTER TABLE public.chambers ADD COLUMN IF NOT EXISTS fee_report NUMERIC DEFAULT 0;

-- 2. Ensure RLS is permissive for Profiles (Fixes 401/42501 during signup)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for all users" ON public.profiles;
CREATE POLICY "Enable all for all users" ON public.profiles 
FOR ALL USING (true) 
WITH CHECK (true);

-- 3. Ensure RLS is permissive for Chambers & Schedules
ALTER TABLE public.chambers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for all users" ON public.chambers;
CREATE POLICY "Enable all for all users" ON public.chambers 
FOR ALL USING (true) 
WITH CHECK (true);

ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for all users" ON public.schedules;
CREATE POLICY "Enable all for all users" ON public.schedules 
FOR ALL USING (true) 
WITH CHECK (true);

-- 4. Grant full access to anonymous and authenticated roles (Demo/Early Build Mode)
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT ALL ON public.chambers TO anon, authenticated;
GRANT ALL ON public.schedules TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 4. Prescription Synchronization Columns
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS clinical_findings TEXT;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS tests_recommended TEXT;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS follow_up_date DATE;

-- 5. Diagnostic Query (Run this to verify columns)
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('chambers', 'prescriptions') 
AND column_name IN ('daily_booking_limit', 'fee_report', 'clinical_findings', 'tests_recommended', 'follow_up_date');
