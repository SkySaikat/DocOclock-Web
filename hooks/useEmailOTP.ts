import { useState, useCallback } from 'react';
import { supabase } from '../supabase';

interface OTPState {
  step: 'IDLE' | 'SENDING' | 'SENT' | 'VERIFYING' | 'VERIFIED' | 'ERROR';
  email: string;
  error: string | null;
}

const EMAIL_SERVER_URL = 'http://localhost:3001';

export const useEmailOTP = () => {
  const [otpState, setOtpState] = useState<OTPState>({
    step: 'IDLE',
    email: '',
    error: null,
  });

  const sendOTP = useCallback(async (email: string) => {
    if (!email || !email.includes('@')) {
      setOtpState({ step: 'ERROR', email, error: 'Please enter a valid email address.' });
      return false;
    }

    setOtpState({ step: 'SENDING', email, error: null });

    try {
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      // Clear old OTPs for this email
      await supabase.from('email_otps').delete().eq('email', email).eq('verified', false);

      // Store OTP in database
      const { error: insertErr } = await supabase.from('email_otps').insert({
        email,
        otp_code: otp,
        expires_at: expiresAt,
        verified: false,
      });

      if (insertErr) throw new Error(insertErr.message);

      // Send email via our SMTP server
      try {
        const res = await fetch(`${EMAIL_SERVER_URL}/api/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp }),
        });

        if (!res.ok) {
          const data = await res.json();
          console.warn('Email server error, OTP still stored:', data.error);
        }
      } catch (fetchErr) {
        // Email server not running — show OTP in dev mode
        console.warn('Email server not reachable. OTP stored in DB.');
        if (import.meta.env.DEV) {
          alert(`[DEV MODE] Your OTP is: ${otp}\n\nStart the email server with: npm run email`);
        }
      }

      setOtpState({ step: 'SENT', email, error: null });
      return true;
    } catch (err: any) {
      setOtpState({
        step: 'ERROR',
        email,
        error: err.message || 'Failed to generate OTP.',
      });
      return false;
    }
  }, []);

  const verifyOTP = useCallback(async (code: string) => {
    if (!code || code.length !== 6) {
      setOtpState(prev => ({ ...prev, error: 'Please enter a 6-digit code.' }));
      return false;
    }

    setOtpState(prev => ({ ...prev, step: 'VERIFYING', error: null }));

    try {
      const { data, error } = await supabase.rpc('verify_email_otp', {
        p_email: otpState.email,
        p_code: code,
      });

      if (error) throw error;

      if (data === true) {
        setOtpState(prev => ({ ...prev, step: 'VERIFIED', error: null }));
        return true;
      } else {
        setOtpState(prev => ({ ...prev, step: 'SENT', error: 'Invalid or expired code. Please try again.' }));
        return false;
      }
    } catch (err: any) {
      setOtpState(prev => ({
        ...prev,
        step: 'SENT',
        error: err.message || 'Verification failed.',
      }));
      return false;
    }
  }, [otpState.email]);

  const resetOTP = useCallback(() => {
    setOtpState({ step: 'IDLE', email: '', error: null });
  }, []);

  return {
    otpState,
    sendOTP,
    verifyOTP,
    resetOTP,
    isVerified: otpState.step === 'VERIFIED',
  };
};
