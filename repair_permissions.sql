-- DOC OCLOCK - PERMISSIONS & RLS RESET
-- Run this in your Supabase SQL Editor individually

-- 1. Ensure RLS is enabled and set a clean policy
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for all users" ON public.profiles;
DROP POLICY IF EXISTS "Public Read Access" ON public.profiles;

CREATE POLICY "Public Read Access" 
ON public.profiles 
FOR SELECT 
USING (true);

-- 2. CRITICAL: Grant access to the 'anon' role used by the app
-- If the previous script failed with an error, these lines likely never ran.
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 3. Diagnostics: Verify visibility
-- After running this, run a simple SELECT to see if data appears here
SELECT * FROM public.profiles WHERE role = 'DOCTOR';
