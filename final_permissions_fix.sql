-- DOC OCLOCK - PERMISSIONS ONLY FIX
-- Run this in your Supabase SQL Editor. 
-- Even if you see errors about "policy already exists", it's fine.

-- 1. Ensure schema is accessible
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 2. Grant SELECT/INSERT/UPDATE on all existing tables
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;

-- 3. Grant access to sequences (for auto-increment IDs if any)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 4. Re-assert RLS read permissions just in case
-- This part might fail if policy exists, but the GRANTS above are the most important.
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Public Read Access'
    ) THEN
        CREATE POLICY "Public Read Access" ON public.profiles FOR SELECT USING (true);
    END IF;
END $$;

-- 5. Diagnostic: Check current user permissions (run this line alone if you want to verify)
SELECT grantee, table_schema, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE grantee = 'anon' AND table_name = 'profiles';
