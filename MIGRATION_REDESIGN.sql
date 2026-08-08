-- ============================================================
-- Dococlock redesign — run this once in the Supabase SQL editor.
-- Safe to re-run (idempotent).
-- ============================================================

-- 1. Hero banner cleanup — deactivates existing banners (does not
--    delete them) so the stale "Korea/automotive" test banner stops
--    showing on the homepage. Re-upload real banners from the Super
--    Admin > Homepage Manager screen afterwards.
UPDATE public.hero_banners SET is_active = false;

-- 2. Blog posts — backs the new "Blogs" nav page.
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title          TEXT NOT NULL,
  slug           TEXT UNIQUE NOT NULL,
  excerpt        TEXT,
  cover_image_url TEXT,
  is_published   BOOLEAN DEFAULT true,
  published_at   TIMESTAMPTZ DEFAULT NOW(),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Open read blog_posts" ON public.blog_posts;
CREATE POLICY "Open read blog_posts" ON public.blog_posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Open write blog_posts" ON public.blog_posts;
CREATE POLICY "Open write blog_posts" ON public.blog_posts FOR ALL WITH CHECK (true);

GRANT ALL ON public.blog_posts TO anon, authenticated;

-- 3. Contact messages — backs the new "Contact us" page form.
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Open insert contact_messages" ON public.contact_messages;
CREATE POLICY "Open insert contact_messages" ON public.contact_messages FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Open read contact_messages" ON public.contact_messages;
CREATE POLICY "Open read contact_messages" ON public.contact_messages FOR SELECT USING (true);

GRANT SELECT, INSERT ON public.contact_messages TO anon, authenticated;
