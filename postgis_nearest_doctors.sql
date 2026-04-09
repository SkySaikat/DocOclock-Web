-- ==============================================================================
-- POSTGIS: Nearest Doctors Discovery Function
-- ==============================================================================

-- Ensure PostGIS is enabled
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Drop if exists to allow clean re-runs
DROP FUNCTION IF EXISTS public.get_nearest_doctors(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION);

-- Create the Stored Procedure
CREATE OR REPLACE FUNCTION public.get_nearest_doctors(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  max_dist_meters DOUBLE PRECISION DEFAULT 50000 -- Default to 50km
) 
RETURNS TABLE (
  doctor_id UUID,
  full_name TEXT,
  specialty TEXT,
  rating NUMERIC,
  image_url TEXT,
  distance_meters DOUBLE PRECISION
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id as doctor_id, 
    p.full_name, 
    p.specialty, 
    p.rating, 
    p.image_url,
    -- ST_Distance calculates the exact spherical distance in meters when using geography types
    ST_Distance(
      p.location::geography, 
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    ) as distance_meters
  FROM public.profiles p
  WHERE p.role = 'DOCTOR' 
    AND p.registration_status = 'approved'
    AND p.location IS NOT NULL
    AND ST_Distance(
      p.location::geography, 
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    ) <= max_dist_meters
  ORDER BY distance_meters ASC
  LIMIT 20;
$$;

-- Grant execution permission
GRANT EXECUTE ON FUNCTION public.get_nearest_doctors(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) TO anon, authenticated;
