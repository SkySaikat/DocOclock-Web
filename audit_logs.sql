-- ==============================================================================
-- UNIVERSAL AUDIT LOGGING
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    changed_by TEXT, -- Will store auth.uid() if available
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Secure Audit Table so it's read-only publicly, or entirely hidden
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super Admins can read audits" ON public.audit_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id::text = auth.uid()::text AND profiles.role = 'SUPER_ADMIN'
  )
);

-- ------------------------------------------------------------------------------
-- Universal Trigger Function
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION log_audit_action()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id TEXT;
BEGIN
    -- Attempt to capture JWT sub, if fallback to 'anonymous/system'
    current_user_id := auth.uid()::text;
    IF current_user_id IS NULL THEN
        current_user_id := 'anonymous_or_system';
    END IF;

    IF (TG_OP = 'DELETE') THEN
        INSERT INTO public.audit_logs (table_name, record_id, action, changed_by, old_data)
        VALUES (TG_TABLE_NAME, OLD.id::text, 'DELETE', current_user_id, row_to_json(OLD)::jsonb);
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.audit_logs (table_name, record_id, action, changed_by, old_data, new_data)
        VALUES (TG_TABLE_NAME, NEW.id::text, 'UPDATE', current_user_id, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.audit_logs (table_name, record_id, action, changed_by, new_data)
        VALUES (TG_TABLE_NAME, NEW.id::text, 'INSERT', current_user_id, row_to_json(NEW)::jsonb);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$;

-- ------------------------------------------------------------------------------
-- Attach Triggers to Critical Tables
-- ------------------------------------------------------------------------------

-- Profiles
DROP TRIGGER IF EXISTS audit_profiles_trigger ON public.profiles;
CREATE TRIGGER audit_profiles_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION log_audit_action();

-- Hospitals
DROP TRIGGER IF EXISTS audit_hospitals_trigger ON public.hospitals;
CREATE TRIGGER audit_hospitals_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.hospitals
FOR EACH ROW EXECUTE FUNCTION log_audit_action();

-- Appointments
DROP TRIGGER IF EXISTS audit_appointments_trigger ON public.appointments;
CREATE TRIGGER audit_appointments_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION log_audit_action();

