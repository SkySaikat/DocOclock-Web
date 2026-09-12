import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const HEX_RE = /^#[0-9a-f]{6}$/i;

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { profileId, primaryColor, secondaryColor, backgroundColor } = await req.json();

    if (!profileId) {
      return new Response(JSON.stringify({ error: 'profileId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    for (const [name, value] of Object.entries({ primaryColor, secondaryColor, backgroundColor })) {
      if (typeof value !== 'string' || !HEX_RE.test(value)) {
        return new Response(JSON.stringify({ error: `${name} must be a 6-digit hex color, e.g. #0ca768` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Re-verify the caller is an approved Super Admin server-side — never trust
    // a role claim from the client. (This mirrors the role-check depth every
    // other admin action in this app already uses; it is not a full auth
    // system, just as strong a guard as the rest of the app has today.)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, registration_status')
      .eq('id', profileId)
      .maybeSingle();

    if (profileError || !profile || profile.role !== 'SUPER_ADMIN' || profile.registration_status !== 'approved') {
      return new Response(JSON.stringify({ error: 'Not authorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: before } = await supabase.from('theme_settings').select('*').eq('id', 1).maybeSingle();

    const { data: updated, error: updateError } = await supabase
      .from('theme_settings')
      .upsert({
        id: 1,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        background_color: backgroundColor,
        updated_by: profileId,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (updateError) throw updateError;

    await supabase.from('audit_logs').insert({
      table_name: 'theme_settings',
      record_id: '1',
      action: 'update',
      changed_by: profileId,
      old_data: before || null,
      new_data: updated,
    });

    return new Response(JSON.stringify({ success: true, theme: updated }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('update-theme error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
