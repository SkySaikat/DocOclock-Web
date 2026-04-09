-- ==============================================================================
-- FIX C4: Remove permissive RLS overrides from mainData.sql
-- Run this AFTER mainData.sql and BEFORE rls_policies.sql
-- This drops the dangerous "Enable all for all users" policies
-- that override the strict 4-role RLS policies.
-- ==============================================================================

-- Drop all "Enable all for all users" permissive policies
DROP POLICY IF EXISTS "Enable all for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable all for all users" ON public.chambers;
DROP POLICY IF EXISTS "Enable all for all users" ON public.schedules;
DROP POLICY IF EXISTS "Enable all for all users" ON public.appointments;
DROP POLICY IF EXISTS "Enable all for all users" ON public.prescriptions;
DROP POLICY IF EXISTS "Enable all for all users" ON public.prescription_medicines;
DROP POLICY IF EXISTS "Enable all for all users" ON public.queue_sessions;
DROP POLICY IF EXISTS "Enable all for all users" ON public.hospitals;
DROP POLICY IF EXISTS "Enable all for all users" ON public.doctor_hospitals;
DROP POLICY IF EXISTS "Enable all for all users" ON public.reviews;

-- Also drop the legacy "Public Read Access" policy if it exists
DROP POLICY IF EXISTS "Public Read Access" ON public.profiles;

-- Verify: After running this, apply rls_policies.sql to establish strict policies.
-- You can verify by running:
-- SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;
