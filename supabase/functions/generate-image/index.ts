import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VALID_ASPECT_RATIOS = ['1:1', '16:9', '4:3'] as const;
const MAX_PROMPT_LENGTH = 2000;
const BUCKET = 'illustrations';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt, aspectRatio } = await req.json();

    if (typeof prompt !== 'string' || !prompt.trim()) {
      return new Response(JSON.stringify({ error: 'A non-empty prompt is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (prompt.length > MAX_PROMPT_LENGTH) {
      return new Response(JSON.stringify({ error: `prompt must be ${MAX_PROMPT_LENGTH} characters or fewer` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const ratio = aspectRatio && VALID_ASPECT_RATIOS.includes(aspectRatio) ? aspectRatio : '1:1';

    // The Gemini key lives only here, as an Edge Function secret
    // (`supabase secrets set GEMINI_API_KEY=...`) — it is never sent to, or
    // reachable from, the browser. This is a static Vite SPA with no
    // server-side execution context of its own, so this Edge Function is
    // the only place in the stack a third-party API key can stay secret.
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      return new Response(JSON.stringify({ error: 'Image generation is not configured on the server.' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${prompt} (aspect ratio ${ratio})` }] }],
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errBody = await geminiResponse.text();
      console.error('Gemini API error:', errBody);
      return new Response(JSON.stringify({ error: 'Image generation failed upstream.' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await geminiResponse.json();
    const base64Image: string | undefined = result?.candidates?.[0]?.content?.parts
      ?.find((p: any) => p.inlineData?.data)?.inlineData?.data;
    const mimeType: string = result?.candidates?.[0]?.content?.parts
      ?.find((p: any) => p.inlineData?.data)?.inlineData?.mimeType || 'image/png';

    if (!base64Image) {
      return new Response(JSON.stringify({ error: 'No image was returned by the model.' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Upload to a public-read Storage bucket rather than returning base64
    // inline, so the client gets back a small, stable, cacheable URL.
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const extension = mimeType.split('/')[1] || 'png';
    const path = `${crypto.randomUUID()}.${extension}`;
    const bytes = Uint8Array.from(atob(base64Image), c => c.charCodeAt(0));

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, bytes, {
      contentType: mimeType,
      upsert: false,
    });
    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path);

    return new Response(JSON.stringify({ success: true, imageUrl: publicUrlData.publicUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('generate-image error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
