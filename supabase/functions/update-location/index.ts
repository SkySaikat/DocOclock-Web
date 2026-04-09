import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Authenticate the User using the JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    // Using service key to execute the UPDATE since PostGIS ST_SetSRID might 
    // require broader permissions or we bypass RLS for this specific automated task.
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify JWT and get user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid token');
    }

    // 2. Capture IP
    // For localhost dev, this might be 127.0.0.1, but in prod Supabase sets x-forwarded-for
    let clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');
    
    // Clean up multiple IPs in x-forwarded-for (takes the first one)
    if (clientIp && clientIp.includes(',')) {
      clientIp = clientIp.split(',')[0].trim();
    }

    // Fallback for local testing (uses a default Dhaka IP if localhost)
    if (!clientIp || clientIp === '127.0.0.1' || clientIp === '::1') {
      clientIp = '103.108.147.228'; // Example IP from Dhaka
    }

    // 3. Ping GeoIP API (ipapi.co)
    const geoResponse = await fetch(`https://ipapi.co/${clientIp}/json/`);
    if (!geoResponse.ok) {
        throw new Error('GeoIP API failed');
    }
    
    const geoData = await geoResponse.json();
    
    if (geoData.error) {
        throw new Error(geoData.reason || 'GeoIP API error');
    }

    const lat = geoData.latitude;
    const lng = geoData.longitude;
    const city = geoData.city;

    if (!lat || !lng) {
        throw new Error('Could not resolve coordinates from IP.');
    }

    // 4. Update the user's profile with the new geometry data
    // We must use a direct RPC call if we want to use PostGIS functions like ST_SetSRID securely
    // OR we can pass it as a raw string if Supabase allows PostGIS format parsing.
    // E.g., location = `SRID=4326;POINT(${lng} ${lat})` (Standard EWKT format)
    
    const ewktLocation = `SRID=4326;POINT(${lng} ${lat})`;

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        last_known_ip: clientIp,
        city: city,
        location: ewktLocation
      })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    // 5. Return the resolved coordinates instantly to the frontend
    return new Response(
      JSON.stringify({
        success: true,
        data: { lat, lng, city, ip: clientIp }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
