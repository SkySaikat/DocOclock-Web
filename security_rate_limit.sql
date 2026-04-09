-- ==============================================================================
-- RATE LIMITING / LOGIN TRACKING
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.login_attempts (
    identifier TEXT PRIMARY KEY,
    failed_attempts INTEGER DEFAULT 0,
    lockout_until TIMESTAMPTZ,
    last_attempt_at TIMESTAMPTZ DEFAULT NOW()
);

-- Turn on basic RLS but allow anon usage for these specific RPC calls
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public login attempts access" ON public.login_attempts;
CREATE POLICY "Public login attempts access" ON public.login_attempts FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- RPC: Pre-check if an account is locked BEFORE attempting login
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_is_locked(p_identifier TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_lockout_until TIMESTAMPTZ;
BEGIN
    SELECT lockout_until INTO v_lockout_until
    FROM public.login_attempts
    WHERE identifier = p_identifier;

    IF v_lockout_until IS NOT NULL AND v_lockout_until > NOW() THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$;

-- ------------------------------------------------------------------------------
-- RPC: Record Login Result
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_login_attempt(p_identifier TEXT, p_success BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_failed_count INTEGER;
BEGIN
    IF p_success THEN
        -- Clear history if successful
        DELETE FROM public.login_attempts WHERE identifier = p_identifier;
    ELSE
        -- Increment fail count
        INSERT INTO public.login_attempts (identifier, failed_attempts, last_attempt_at)
        VALUES (p_identifier, 1, NOW())
        ON CONFLICT (identifier) DO UPDATE 
        SET 
            failed_attempts = login_attempts.failed_attempts + 1,
            last_attempt_at = NOW(),
            lockout_until = CASE 
                WHEN login_attempts.failed_attempts + 1 >= 5 THEN NOW() + INTERVAL '15 minutes'
                ELSE NULL
            END;
    END IF;
END;
$$;
