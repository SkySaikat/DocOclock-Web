-- ==============================================================================
-- DOCOCLOCK — HOSPITAL HIERARCHY MIGRATION
-- Run this in Supabase SQL Editor if you already ran SETUP_DOCOCLOCK.sql.
-- This adds: hospital_branches, hospital_sectors, chamber_requests
-- and new columns to: profiles, chambers, doctor_hospitals
-- ==============================================================================

-- 1. Add branch_id to profiles (for branch managers)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS branch_id UUID;

-- 2. HOSPITAL BRANCHES
CREATE TABLE IF NOT EXISTS public.hospital_branches (
    id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id  UUID        NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    name         TEXT        NOT NULL,
    address      TEXT        NOT NULL,
    contact_info TEXT,
    manager_id   UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 3. HOSPITAL SECTORS (departments)
CREATE TABLE IF NOT EXISTS public.hospital_sectors (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID        NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    branch_id   UUID        REFERENCES public.hospital_branches(id) ON DELETE CASCADE,
    name        TEXT        NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CHAMBER REQUESTS (doctor → hospital join requests)
CREATE TABLE IF NOT EXISTS public.chamber_requests (
    id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    hospital_id  UUID        NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    branch_id    UUID        REFERENCES public.hospital_branches(id) ON DELETE SET NULL,
    sector_id    UUID        REFERENCES public.hospital_sectors(id)  ON DELETE SET NULL,
    proposed_fee NUMERIC     DEFAULT 0,
    status       TEXT        NOT NULL DEFAULT 'pending', -- pending | approved | rejected
    reviewed_by  UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at  TIMESTAMPTZ,
    note         TEXT,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Add new columns to chambers
ALTER TABLE public.chambers
  ADD COLUMN IF NOT EXISTS branch_id  UUID REFERENCES public.hospital_branches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sector_id  UUID REFERENCES public.hospital_sectors(id)  ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS request_id UUID REFERENCES public.chamber_requests(id)  ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status     TEXT NOT NULL DEFAULT 'active'; -- active | pending

-- 6. Add branch_id + sector_id to doctor_hospitals
ALTER TABLE public.doctor_hospitals
  ADD COLUMN IF NOT EXISTS branch_id TEXT,
  ADD COLUMN IF NOT EXISTS sector_id TEXT;

-- 7. RLS (open) for new tables
ALTER TABLE public.hospital_branches  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_sectors   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chamber_requests   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "open" ON public.hospital_branches;
DROP POLICY IF EXISTS "open" ON public.hospital_sectors;
DROP POLICY IF EXISTS "open" ON public.chamber_requests;

CREATE POLICY "open" ON public.hospital_branches  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON public.hospital_sectors   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON public.chamber_requests   FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON public.hospital_branches  TO anon, authenticated;
GRANT ALL ON public.hospital_sectors   TO anon, authenticated;
GRANT ALL ON public.chamber_requests   TO anon, authenticated;

-- 8. Indexes
CREATE INDEX IF NOT EXISTS idx_branches_hospital   ON public.hospital_branches  (hospital_id);
CREATE INDEX IF NOT EXISTS idx_sectors_hospital    ON public.hospital_sectors   (hospital_id);
CREATE INDEX IF NOT EXISTS idx_sectors_branch      ON public.hospital_sectors   (branch_id);
CREATE INDEX IF NOT EXISTS idx_requests_doctor     ON public.chamber_requests   (doctor_id);
CREATE INDEX IF NOT EXISTS idx_requests_hospital   ON public.chamber_requests   (hospital_id);
CREATE INDEX IF NOT EXISTS idx_requests_status     ON public.chamber_requests   (status);

-- ==============================================================================
-- VERIFY
-- SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;
-- ==============================================================================
