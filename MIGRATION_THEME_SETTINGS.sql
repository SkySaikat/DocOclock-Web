-- ============================================================
-- Dococlock theming system — run this once in the Supabase SQL editor.
-- Safe to re-run (idempotent).
--
-- Unlike `system_settings` (which has one blanket open RLS policy shared
-- by unrelated low-stakes toggles), this table is deliberately locked
-- down from day one: anyone can read the current theme (needed so even
-- logged-out visitors see the right brand colors), but nobody can write
-- it directly — not even with the public anon key. The only way to
-- change it is the `update-theme` Supabase Edge Function, which uses the
-- service-role key server-side after checking the caller is an approved
-- SUPER_ADMIN. See supabase/functions/update-theme/index.ts.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.theme_settings (
    id               SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- singleton row
    primary_color    TEXT NOT NULL DEFAULT '#0ca768',
    secondary_color  TEXT NOT NULL DEFAULT '#03402a',
    background_color TEXT NOT NULL DEFAULT '#f5f7f6',
    updated_by       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.theme_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_theme" ON public.theme_settings;
CREATE POLICY "public_read_theme" ON public.theme_settings FOR SELECT USING (true);

-- Deliberately no INSERT/UPDATE/DELETE policy for anon/authenticated — with
-- RLS enabled and no matching policy, those commands are denied by default.
-- Only SELECT is granted; writes only ever happen via the service-role key.
REVOKE ALL ON public.theme_settings FROM anon, authenticated;
GRANT SELECT ON public.theme_settings TO anon, authenticated;
