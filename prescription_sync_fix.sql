-- Add missing fields to prescriptions table
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS clinical_findings TEXT;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS tests_recommended TEXT;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS follow_up_date DATE;
