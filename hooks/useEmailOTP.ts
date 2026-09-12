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
      // OTP generation and storage now happen entirely server-side, in the
      // `send-otp` Supabase Edge Function (supabase/functions/send-otp) —
      // this used to generate the code in the browser and write it directly
      // to the open-RLS `email_otps` table, which meant anyone could insert
      // their own OTP for any email address and skip the email step
      // entirely. The Edge Function uses the service-role key, so the
      // client never touches `email_otps` on the send path anymore.
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { email },
      });

      if (error) throw new Error(error.message || 'Failed to send verification code.');
      if (data?.error) throw new Error(data.error);

      setOtpState({ step: 'SENT', email, error: null });
      return true;
    } catch (err: any) {
      setOtpState({
        step: 'ERROR',
        email,
        error: err.message || 'Failed to send verification code.',
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
