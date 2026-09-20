/**
 * Non-query parts of the Supabase client surface: rpc(), auth, storage, functions, realtime.
 *
 * Extend the fixtures without touching the engine:
 *   registerRpc('my_fn', (args) => ({ data: ..., error: null }))
 *   registerFunction('my-edge-fn', (body) => ({ data: ..., error: null }))
 */
import { table } from './db';

export interface RpcResult { data: any; error: { message: string; code: string; details: string | null; hint: string | null } | null }
export type RpcHandler = (args: Record<string, any>) => RpcResult | Promise<RpcResult>;
export type FunctionHandler = (body: any) => { data: any; error: any } | Promise<{ data: any; error: any }>;

const wait = (ms = 20) => new Promise<void>(res => setTimeout(res, ms));
const ok = (data: any): RpcResult => ({ data, error: null });

// ─────────────────────────────────────────────────────────────────────────────
// rpc()
// ─────────────────────────────────────────────────────────────────────────────
const rpcHandlers: Record<string, RpcHandler> = {
  /** Email OTP: any 6-digit code verifies (real OTPs are generated server-side by the send-otp Edge Function). */
  verify_email_otp: args => ok(/^\d{6}$/.test(String(args.p_code ?? ''))),
  check_is_locked: () => ok(false),
  record_login_attempt: () => ok(null),
  /** PostGIS nearest-doctor lookup: deterministic fake distances, approved doctors only. */
  get_nearest_doctors: args => {
    const max = Number(args.max_dist_meters ?? 50000);
    const doctors = table('profiles').filter(p => p.role === 'DOCTOR' && p.registration_status === 'approved');
    return ok(
      doctors
        .map((d, i) => ({
          doctor_id: d.id,
          full_name: d.full_name,
          specialty: d.specialty,
          degrees: d.degrees,
          image_url: d.image_url,
          rating: d.rating,
          experience_years: d.experience_years,
          distance_meters: 900 + i * 2300 + (i % 3) * 410,
        }))
        .filter(d => d.distance_meters <= max)
        .sort((a, b) => a.distance_meters - b.distance_meters),
    );
  },
};

export function registerRpc(name: string, handler: RpcHandler): void { rpcHandlers[name] = handler; }

export async function rpc(name: string, args: Record<string, any> = {}): Promise<RpcResult & { status: number; statusText: string; count: null }> {
  await wait();
  const h = rpcHandlers[name];
  if (!h) {
    console.debug(`[dev-mocks] rpc("${name}") is not mocked. Add it with registerRpc() in dev-mocks/engine/clientStubs.ts`);
    return { data: null, error: { message: `Could not find the function public.${name} in the mock`, code: 'PGRST202', details: null, hint: 'Register it via registerRpc()' }, status: 404, statusText: 'Not Found', count: null };
  }
  const res = await h(args);
  return { ...res, status: res.error ? 400 : 200, statusText: res.error ? 'Bad Request' : 'OK', count: null };
}

// ─────────────────────────────────────────────────────────────────────────────
// functions.invoke()  (Edge Functions)
// ─────────────────────────────────────────────────────────────────────────────
const fnHandlers: Record<string, FunctionHandler> = {
  'send-otp': () => ({ data: { success: true, mock: true }, error: null }),
  'update-theme': () => ({ data: { success: true, mock: true }, error: null }),
  'update-location': () => ({ data: { success: true, data: { lat: 23.7808, lng: 90.4167, city: 'Dhaka' } }, error: null }),
  'generate-image': () => ({ data: { error: 'generate-image is not available in the dev mock' }, error: null }),
};

export function registerFunction(name: string, handler: FunctionHandler): void { fnHandlers[name] = handler; }

export const functions = {
  async invoke(name: string, opts?: { body?: any }) {
    await wait();
    const h = fnHandlers[name];
    if (!h) return { data: { success: true, mock: true }, error: null };
    return h(opts?.body);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// auth  (the app uses its own bcrypt auth; auth.uid() is always null there too)
// ─────────────────────────────────────────────────────────────────────────────
const noSession = { data: { session: null, user: null }, error: null };
export const auth = {
  async getSession() { return { data: { session: null }, error: null }; },
  async getUser() { return { data: { user: null }, error: null }; },
  onAuthStateChange(_cb?: any) { return { data: { subscription: { unsubscribe() { /* noop */ } } } }; },
  async signInWithPassword() { return { ...noSession, error: { message: 'Supabase Auth is not used by this app (mock)', status: 400 } }; },
  async signInWithOAuth() { return { data: { provider: null, url: null }, error: null }; },
  async signUp() { return noSession; },
  async signOut() { return { error: null }; },
  async refreshSession() { return noSession; },
  async setSession() { return noSession; },
};

// ─────────────────────────────────────────────────────────────────────────────
// storage  (uploads are kept as blob: URLs for the lifetime of the page)
// ─────────────────────────────────────────────────────────────────────────────
const uploaded = new Map<string, string>();
const PLACEHOLDER = '/assets/figma/avatar-stack-1.png';

export const storage = {
  from(bucket: string) {
    const key = (p: string) => `${bucket}/${p}`;
    return {
      async upload(path: string, file: any, _opts?: any) {
        await wait(60);
        try {
          if (file && typeof URL !== 'undefined' && (file instanceof Blob)) uploaded.set(key(path), URL.createObjectURL(file));
        } catch { /* ignore */ }
        return { data: { path, id: `mock-${Date.now()}`, fullPath: key(path) }, error: null };
      },
      async update(path: string, file: any, opts?: any) { return (this as any).upload(path, file, opts); },
      getPublicUrl(path: string) {
        return { data: { publicUrl: uploaded.get(key(path)) ?? PLACEHOLDER } };
      },
      async createSignedUrl(path: string) { return { data: { signedUrl: uploaded.get(key(path)) ?? PLACEHOLDER }, error: null }; },
      async remove(paths: string[]) { paths.forEach(p => uploaded.delete(key(p))); return { data: [], error: null }; },
      async list() { return { data: [], error: null }; },
      async download() { return { data: new Blob([]), error: null }; },
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// realtime  (never fires, never throws)
// ─────────────────────────────────────────────────────────────────────────────
export function channel(name: string) {
  const ch: any = {
    topic: name,
    on() { return ch; },
    subscribe(cb?: (status: string) => void) { if (cb) setTimeout(() => cb('SUBSCRIBED'), 0); return ch; },
    async unsubscribe() { return 'ok'; },
    async send() { return 'ok'; },
    async track() { return 'ok'; },
    async untrack() { return 'ok'; },
    presenceState() { return {}; },
  };
  return ch;
}
export async function removeChannel(_ch?: any) { return 'ok'; }
export async function removeAllChannels() { return ['ok']; }
export const getChannels = () => [] as any[];
