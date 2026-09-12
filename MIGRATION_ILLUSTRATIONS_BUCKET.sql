-- ============================================================
-- Storage bucket for AI-generated illustrations (supabase/functions/generate-image).
-- Run once in the Supabase SQL editor. Safe to re-run (idempotent).
--
-- Public READ (anyone can view/display a generated image via its URL) but
-- no public WRITE — only the generate-image Edge Function (service-role
-- key) ever uploads to this bucket.
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('illustrations', 'illustrations', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read illustrations" ON storage.objects;
CREATE POLICY "Public read illustrations" ON storage.objects
  FOR SELECT USING (bucket_id = 'illustrations');

-- Deliberately no INSERT/UPDATE/DELETE policy for anon/authenticated —
-- uploads only ever happen via the service-role key inside the Edge Function.
