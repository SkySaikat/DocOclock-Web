import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    return {
      server: {
        // Default stays 3000 (Google Calendar OAuth's authorized origin is http://localhost:3000, see hooks/useGoogleCalendar.ts).
        // A preview/launcher can hand us a free port via PORT when 3000 is taken by another project; then fail loudly instead of drifting.
        port: Number(process.env.PORT) || 3000,
        strictPort: Boolean(process.env.PORT),
        host: '0.0.0.0',
      },
      plugins: [react()],
      // No `define` for API keys here on purpose: this is a static Vite SPA
      // with no server-side execution context, so anything baked into the
      // client bundle (via `define` or a VITE_*-prefixed env var) is public,
      // extractable JS — never a real secret. Server-only keys (Gemini,
      // Resend, SMTP, the Supabase service-role key) belong in Supabase Edge
      // Function secrets instead — see supabase/functions/generate-image.
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              recharts: ['recharts'],
              jspdf: ['jspdf', 'html2canvas'],
            }
          }
        }
      }
    };
});
