-- ==============================================================================
-- SEED DUMMY LOCATIONS FOR DOCTORS
-- This script assigns randomized coordinates (around Dhaka, Bangladesh)
-- to any DOCTOR profiles that currently have a NULL location.
-- Base Coordinates (Dhaka): 23.8103° N, 90.4125° E
-- ==============================================================================

UPDATE public.profiles
SET location = ST_SetSRID(ST_MakePoint(
    -- Longitude: Random between 90.35 and 90.45
    90.35 + random() * 0.1, 
    -- Latitude: Random between 23.75 and 23.85
    23.75 + random() * 0.1
), 4326)
WHERE role = 'DOCTOR' AND location IS NULL;

-- Automatically approve doctors if they are stuck in pending during debugging
-- (Optional: remove if you strictly want to manage this via Super Admin Dashboard)
UPDATE public.profiles
SET registration_status = 'approved'
WHERE role = 'DOCTOR' AND registration_status = 'pending';
