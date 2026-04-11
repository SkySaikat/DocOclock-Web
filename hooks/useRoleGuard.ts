import { useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabase';
import { UserRole } from '../types';

/**
 * useRoleGuard
 * 
 * Security middleware hook that verifies user role against the database.
 * If a user spoofs their localStorage role, this hook detects the mismatch
 * and force-logs them out.
 * 
 * NOTE: This app does NOT use react-router-dom. Navigation is handled via
 * manual `currentPath` state. We use the `logout` callback from AuthContext
 * which triggers App.tsx to reset state and show the public home.
 */
export const useRoleGuard = (expectedRole: UserRole) => {
  const { profile, userRole, logout } = useAuth();

  useEffect(() => {
    let isMounted = true;

    const verifyStrictRole = async () => {
      // 1. No profile = not authenticated
      if (!profile || !profile.id) {
        logout();
        return;
      }

      // 2. Client-side mismatch
      if (userRole !== expectedRole) {
        console.warn(`[Security] Role mismatch. Expected ${expectedRole}, got ${userRole}`);
        logout();
        return;
      }

      try {
        // 3. Database source-of-truth check
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', profile.id)
          .single();

        if (error || !data) {
          if (import.meta.env.DEV) {
            console.error('[Security] Failed to verify role from DB.', error);
          }
          if (isMounted) logout();
          return;
        }

        // 4. Strict enforcement — DB role doesn't match expected
        if (data.role !== expectedRole) {
          if (import.meta.env.DEV) {
            console.error(`[Security] CRITICAL: DB Role Mismatch. DB: ${data.role}, Expected: ${expectedRole}`);
          }
          if (isMounted) logout();
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('[Security] Role verification error', err);
        }
        if (isMounted) logout();
      }
    };

    verifyStrictRole();

    return () => {
      isMounted = false;
    };
  }, [profile, userRole, expectedRole, logout]);
};
