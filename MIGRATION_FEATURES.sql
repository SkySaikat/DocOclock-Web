-- ============================================================
-- DocOclock Feature Migration
-- Run this in Supabase SQL Editor after MIGRATION_HOSPITAL_HIERARCHY.sql
-- ============================================================

-- 1. Add id_photo_url to profiles (doctor ID card photo)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS id_photo_url TEXT;

-- 2. Doctor Reviews table
CREATE TABLE IF NOT EXISTS public.doctor_reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  patient_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  rating      NUMERIC(2,1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (doctor_id, patient_id)   -- one review per patient per doctor
);

-- Enable RLS (open policies — custom bcrypt auth, no auth.uid())
ALTER TABLE public.doctor_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Open read reviews" ON public.doctor_reviews;
CREATE POLICY "Open read reviews" ON public.doctor_reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Open insert reviews" ON public.doctor_reviews;
CREATE POLICY "Open insert reviews" ON public.doctor_reviews
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Open update reviews" ON public.doctor_reviews;
CREATE POLICY "Open update reviews" ON public.doctor_reviews
  FOR UPDATE USING (true) WITH CHECK (true);

GRANT ALL ON public.doctor_reviews TO anon, authenticated;

-- 3. Supabase Storage buckets (run in Supabase Dashboard → Storage if not via SQL)
-- Create bucket: avatars (already exists from DoctorProfileEditor)
-- Create bucket: doctor-id-photos (new)
-- Both should be public buckets so images can be read without auth.
-- In Supabase Dashboard → Storage → New bucket:
--   Name: doctor-id-photos
--   Public: true
--   Allowed MIME types: image/*

-- If using SQL to create storage buckets:
INSERT INTO storage.buckets (id, name, public, allowed_mime_types)
VALUES ('doctor-id-photos', 'doctor-id-photos', true, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, allowed_mime_types)
VALUES ('avatars', 'avatars', true, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS for doctor-id-photos
DROP POLICY IF EXISTS "Public read doctor-id-photos" ON storage.objects;
CREATE POLICY "Public read doctor-id-photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'doctor-id-photos');

DROP POLICY IF EXISTS "Authenticated upload doctor-id-photos" ON storage.objects;
CREATE POLICY "Authenticated upload doctor-id-photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'doctor-id-photos');

-- Storage RLS for avatars
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
CREATE POLICY "Public read avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Authenticated upload avatars" ON storage.objects;
CREATE POLICY "Authenticated upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Authenticated update avatars" ON storage.objects;
CREATE POLICY "Authenticated update avatars" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars') WITH CHECK (bucket_id = 'avatars');

-- 4. Hero Banner Slider (managed by Super Admin)
CREATE TABLE IF NOT EXISTS public.hero_banners (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  desktop_image_url TEXT NOT NULL,
  mobile_image_url  TEXT,           -- falls back to desktop_image_url if null
  title          TEXT,
  subtitle       TEXT,
  sort_order     INT DEFAULT 0,
  is_active      BOOLEAN DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.hero_banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Open read hero_banners" ON public.hero_banners;
CREATE POLICY "Open read hero_banners" ON public.hero_banners FOR SELECT USING (true);

DROP POLICY IF EXISTS "Open write hero_banners" ON public.hero_banners;
CREATE POLICY "Open write hero_banners" ON public.hero_banners FOR ALL WITH CHECK (true);

GRANT ALL ON public.hero_banners TO anon, authenticated;

-- Storage bucket for hero images
INSERT INTO storage.buckets (id, name, public, allowed_mime_types)
VALUES ('hero-images', 'hero-images', true, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read hero-images" ON storage.objects;
CREATE POLICY "Public read hero-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'hero-images');

DROP POLICY IF EXISTS "Upload hero-images" ON storage.objects;
CREATE POLICY "Upload hero-images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'hero-images');

DROP POLICY IF EXISTS "Update hero-images" ON storage.objects;
CREATE POLICY "Update hero-images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'hero-images');

DROP POLICY IF EXISTS "Delete hero-images" ON storage.objects;
CREATE POLICY "Delete hero-images" ON storage.objects
  FOR DELETE USING (bucket_id = 'hero-images');

-- 5. Notification Center
CREATE TABLE IF NOT EXISTS public.notifications (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  body         TEXT,
  type         TEXT NOT NULL DEFAULT 'system',
  -- type values: appointment_booked | delay_alert | approval_status | prescription_ready | review_received | system
  is_read      BOOLEAN DEFAULT false,
  link         TEXT,          -- navigation path to open on click
  metadata     JSONB,         -- { appointment_id, doctor_id, etc. }
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Open read notifications" ON public.notifications;
CREATE POLICY "Open read notifications" ON public.notifications FOR SELECT USING (true);

DROP POLICY IF EXISTS "Open write notifications" ON public.notifications;
CREATE POLICY "Open write notifications" ON public.notifications FOR ALL WITH CHECK (true);

GRANT ALL ON public.notifications TO anon, authenticated;

CREATE INDEX IF NOT EXISTS idx_notifications_recipient
  ON public.notifications(recipient_id, is_read, created_at DESC);

-- 6. Consultation duration on chambers + chief complaint on appointments
ALTER TABLE public.chambers
  ADD COLUMN IF NOT EXISTS consultation_duration_minutes INT DEFAULT 0;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS chief_complaint TEXT,
  ADD COLUMN IF NOT EXISTS visit_type TEXT DEFAULT 'new_patient';
  -- visit_type values: new_patient | follow_up | report_discussion | chronic_condition | emergency

-- 7. Medicine catalog: track doctor-submitted entries for super admin review
ALTER TABLE public.medicines
  ADD COLUMN IF NOT EXISTS added_by_doctor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT true;
  -- added_by_doctor_id: NULL = seeded/admin-added, UUID = doctor submitted
  -- is_verified: false = pending super admin review, true = verified & live
