-- ============================================================
-- Email OTP hardening — run this once in the Supabase SQL editor,
-- AFTER deploying the `send-otp` Edge Function and confirming
-- hooks/useEmailOTP.ts is calling it (not writing to email_otps
-- directly). Safe to re-run (idempotent).
--
-- Previously `email_otps` had an "open" FOR ALL policy, combined with the
-- client generating and inserting its own OTP code directly — meaning
-- anyone with the public anon key could write an OTP for any email
-- address and "verify" it without ever receiving the email. OTP
-- generation and storage now happen only inside the `send-otp` Edge
-- Function (service-role key, bypasses RLS), and verification already
-- goes through the `verify_email_otp` RPC, which is SECURITY DEFINER and
-- so does not need the client to have direct table access either.
-- With both read paths covered by trusted server-side code, the client
-- needs no direct grant on this table at all.
-- ============================================================

DROP POLICY IF EXISTS "open" ON public.email_otps;

REVOKE ALL ON public.email_otps FROM anon, authenticated;
