import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials missing. Check .env.local');
} else {
    console.log('Initializing Supabase with URL:', supabaseUrl);
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
console.log("SUPABASE URL:", import.meta.env.VITE_SUPABASE_URL)