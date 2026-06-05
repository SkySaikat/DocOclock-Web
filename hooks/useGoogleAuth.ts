/**
 * Google Sign-In for patients.
 * Uses OAuth2 implicit flow (popup) — same pattern as useGoogleCalendar.
 * After auth, fetches user info from Google, then creates/finds the patient in Supabase.
 */

import { useCallback } from 'react';
import { supabase } from '../supabase';
import bcrypt from 'bcryptjs';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export interface GoogleUser {
  email: string;
  name: string;
  picture: string;
  sub: string; // Google user ID
}

async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUser> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Failed to fetch Google user info');
  return res.json();
}

export const useGoogleAuth = () => {
  const signInWithGoogle = useCallback((): Promise<GoogleUser> => {
    return new Promise((resolve, reject) => {
      if (!CLIENT_ID) {
        reject(new Error('Google Client ID not configured.'));
        return;
      }

      // redirect_uri must exactly match an Authorized Redirect URI in Google Cloud Console
      const redirectUri = `${window.location.protocol}//${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}`;

      const params = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: 'token',
        scope: 'openid profile email',
        prompt: 'select_account',
      });

      const popup = window.open(
        `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
        'google_signin',
        'width=500,height=600,left=200,top=100'
      );

      if (!popup) {
        reject(new Error('Popup blocked. Please allow popups for this site.'));
        return;
      }

      const interval = setInterval(async () => {
        try {
          if (!popup || popup.closed) {
            clearInterval(interval);
            reject(new Error('Sign-in cancelled.'));
            return;
          }
          const hash = popup.location.hash;
          if (!hash || !hash.includes('access_token')) return;

          const tokenParams = new URLSearchParams(hash.substring(1));
          const access_token = tokenParams.get('access_token');
          if (!access_token) return;

          clearInterval(interval);
          popup.close();

          const userInfo = await fetchGoogleUserInfo(access_token);
          resolve(userInfo);
        } catch {
          // Cross-origin errors while popup is on Google's domain — ignore
        }
      }, 500);
    });
  }, []);

  /**
   * Find or create a patient profile from Google user info.
   * Returns the profile row + whether it was newly created.
   */
  const findOrCreateGooglePatient = useCallback(async (googleUser: GoogleUser) => {
    // 1. Check if patient already exists by email
    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', googleUser.email)
      .eq('role', 'PATIENT')
      .maybeSingle();

    if (existing) {
      // Update avatar if they don't have one
      if (!existing.image_url && googleUser.picture) {
        await supabase.from('profiles').update({ image_url: googleUser.picture }).eq('id', existing.id);
        existing.image_url = googleUser.picture;
      }
      return { profile: existing, isNew: false };
    }

    // 2. Create new patient — use a random bcrypt password (they'll always sign in via Google)
    const randomPwd = Math.random().toString(36) + Math.random().toString(36);
    const hash = await bcrypt.hash(randomPwd, 10);

    const { data: newProfile, error } = await supabase
      .from('profiles')
      .insert([{
        full_name: googleUser.name,
        email: googleUser.email,
        role: 'PATIENT',
        password: hash,
        image_url: googleUser.picture,
        registration_status: 'approved',
        relationship: 'Self',
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;
    return { profile: newProfile, isNew: true };
  }, []);

  return { signInWithGoogle, findOrCreateGooglePatient, isConfigured: !!CLIENT_ID };
};
