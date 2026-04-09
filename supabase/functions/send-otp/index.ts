import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Valid email required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // Store OTP in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Clear any existing OTPs for this email first
    await supabase.from('email_otps').delete().eq('email', email).eq('verified', false);

    // Insert new OTP
    const { error: insertError } = await supabase.from('email_otps').insert({
      email,
      otp_code: otp,
      expires_at: expiresAt,
      verified: false,
    });

    if (insertError) {
      throw new Error(`Failed to store OTP: ${insertError.message}`);
    }

    // Send email via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (resendApiKey) {
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'DocOclock <onboarding@resend.dev>',
          to: [email],
          subject: `DocOclock Verification Code: ${otp}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="display: inline-block; background: linear-gradient(135deg, #3B82F6, #1D4ED8); color: white; width: 56px; height: 56px; border-radius: 16px; line-height: 56px; font-size: 24px; font-weight: 900;">D</div>
                <h1 style="margin: 16px 0 4px; font-size: 24px; font-weight: 900; color: #0F172A;">DocOclock</h1>
                <p style="color: #64748B; font-size: 14px; margin: 0;">Healthcare Platform</p>
              </div>
              
              <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: 32px; text-align: center;">
                <p style="color: #475569; font-size: 14px; margin: 0 0 24px;">Your verification code is:</p>
                <div style="background: #0F172A; color: white; font-size: 36px; font-weight: 900; letter-spacing: 12px; padding: 20px 32px; border-radius: 12px; font-family: monospace;">
                  ${otp}
                </div>
                <p style="color: #94A3B8; font-size: 12px; margin: 24px 0 0;">This code expires in <strong>10 minutes</strong>.</p>
              </div>
              
              <p style="color: #94A3B8; font-size: 11px; text-align: center; margin-top: 32px;">
                If you didn't request this code, please ignore this email.
              </p>
            </div>
          `,
        }),
      });

      if (!emailResponse.ok) {
        const errBody = await emailResponse.text();
        console.error('Resend API error:', errBody);
        // Don't fail — OTP is stored, user can still try. Log for debugging.
      }
    } else {
      // No Resend key — log OTP to console for development
      console.log(`[DEV MODE] OTP for ${email}: ${otp}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'OTP sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('send-otp error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
