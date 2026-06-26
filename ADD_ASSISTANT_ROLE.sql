-- Run this script in your Supabase SQL Editor to support the ASSISTANT role

-- 1. Add parent_id to link an assistant to a doctor
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2. Add permissions JSONB to store granular ACL
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{"manage_queue": true, "manage_appointments": true}'::jsonb;

-- 3. Update the view to include these new columns if necessary (RLS is currently open)
