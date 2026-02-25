-- DOC OCLOCK - SIGNUP & PROFILE PERMISSION FIX
-- Run this in your Supabase SQL Editor to restore signup functionality.

-- 1. Restore INSERT and UPDATE policies for the profiles table
-- The previous "Public Read Access" policy only allowed SELECT.
-- We are restoring "FOR ALL" to allow Signup and Profile Updates.

DROP POLICY IF EXISTS "Public Read Access" ON public.profiles;
DROP POLICY IF EXISTS "Enable all for all users" ON public.profiles;

CREATE POLICY "Enable all for all users" 
ON public.profiles 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 2. Ensure the 'anon' role (used by the frontend) has correct table-level grants
GRANT ALL ON public.profiles TO anon;
GRANT ALL ON public.profiles TO authenticated;

-- 3. Ensure sequences are accessible for auto-generated IDs
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 4. Verification Diagnostic
-- After running, this should return 'YES' for INSERT and UPDATE
SELECT table_name, privilege_type, is_grantable 
FROM information_schema.table_privileges 
WHERE table_name = 'profiles' AND grantee = 'anon';
