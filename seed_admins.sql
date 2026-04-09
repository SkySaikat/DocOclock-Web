-- ==============================================================================
-- ADMIN SEEDING SQL
-- Run this ONCE to create your Super Admin and Hospital Admin accounts.
-- After this, only the Super Admin dashboard can create new admins.
-- ==============================================================================

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  1. SUPER ADMIN ACCOUNT                                      ║
-- ║  Email: superadmin@dococlock.com                              ║
-- ║  Password: SuperAdmin@2026                                    ║
-- ╚══════════════════════════════════════════════════════════════╝

INSERT INTO public.profiles (
  full_name, email, role, password, registration_status, created_at
) VALUES (
  'System Administrator',
  'superadmin@dococlock.com',
  'SUPER_ADMIN',
  '$2b$10$DEQeQAy1H6omTeQ4m.B8RejWasAshhY1eWFfZIEOtn4qzvFqMmemm',
  'approved',
  NOW()
) ON CONFLICT DO NOTHING;


-- ╔══════════════════════════════════════════════════════════════╗
-- ║  2. HOSPITAL ADMIN ACCOUNT                                   ║
-- ║  Email: hospital@dococlock.com                                ║
-- ║  Password: HospitalAdmin@2026                                 ║
-- ╚══════════════════════════════════════════════════════════════╝

INSERT INTO public.profiles (
  full_name, email, role, password, registration_status, created_at
) VALUES (
  'Hospital Administrator',
  'hospital@dococlock.com',
  'HOSPITAL_ADMIN',
  '$2b$10$DEQeQAy1H6omTeQ4m.B8ReQ5E2tBWiJgO0rUUx7txG6YZffr4ULVG',
  'approved',
  NOW()
) ON CONFLICT DO NOTHING;


-- ╔══════════════════════════════════════════════════════════════╗
-- ║  3. LINK THE HOSPITAL ADMIN TO A HOSPITAL                    ║
-- ║  (Create a sample hospital and assign ownership)              ║  
-- ╚══════════════════════════════════════════════════════════════╝

-- First, get the hospital admin's ID
DO $$
DECLARE
  admin_id UUID;
BEGIN
  SELECT id INTO admin_id FROM public.profiles WHERE email = 'hospital@dococlock.com' LIMIT 1;
  
  IF admin_id IS NOT NULL THEN
    INSERT INTO public.hospitals (name, address, contact_info, owner_id) 
    VALUES (
      'DocOclock Central Hospital',
      '123 Medical Avenue, Dhaka 1205, Bangladesh',
      '+880-1700-000000',
      admin_id
    ) ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Hospital Admin linked to hospital. Admin ID: %', admin_id;
  END IF;
END;
$$ LANGUAGE plpgsql;


-- ==============================================================================
-- VERIFICATION: Run this query to confirm the accounts exist
-- ==============================================================================
-- SELECT id, full_name, email, role, registration_status FROM profiles WHERE role IN ('SUPER_ADMIN', 'HOSPITAL_ADMIN');
-- SELECT * FROM hospitals;
