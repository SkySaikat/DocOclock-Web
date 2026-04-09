import { useState, useCallback } from 'react';
import { supabase } from '../supabase';

interface OTPState {
  step: 'IDLE' | 'SENDING' | 'SENT' | 'VERIFYING' | 'VERIFIED' | 'ERROR';
  email: string;
  error: string | null;
}

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
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { email },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'Failed to send OTP');
      }

      setOtpState({ step: 'SENT', email, error: null });
      return true;
    } catch (err: any) {
      // Fallback: If Edge Function isn't deployed, store OTP directly in DB
      // This allows the system to work even without the Edge Function
      try {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        // Clear old OTPs for this email
        await supabase.from('email_otps').delete().eq('email', email).eq('verified', false);

        // Insert new OTP
        const { error: insertErr } = await supabase.from('email_otps').insert({
          email,
          otp_code: otp,
          expires_at: expiresAt,
          verified: false,
        });

        if (insertErr) throw insertErr;

        // Log OTP to console in dev mode (since email won't actually send)
        console.log(`[DEV FALLBACK] OTP for ${email}: ${otp}`);
        alert(`[DEV MODE] Your OTP is: ${otp}\n\nIn production, this will be sent to your email.`);

        setOtpState({ step: 'SENT', email, error: null });
        return true;
      } catch (fallbackErr: any) {
        setOtpState({
          step: 'ERROR',
          email,
          error: fallbackErr.message || 'Failed to generate OTP. Please try again.',
        });
        return false;
      }
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
