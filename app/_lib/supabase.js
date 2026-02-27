import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    '⚠️  Supabase not configured. Set SUPABASE_URL and SUPABASE_KEY in .env.local'
  );
}

if (!supabaseServiceKey || supabaseServiceKey === 'placeholder-key') {
  console.error(
    '❌ CRITICAL: SUPABASE_SERVICE_KEY is missing or not set in .env.local. Server-side database writes will fail! Get it from: Supabase Dashboard → Settings → API → Service role secret'
  );
}

// Client-side Supabase client - uses anon key, respects RLS policies
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Server-side Supabase client - uses service role key, bypasses RLS
// Only use this in API routes and server-side code, never expose to client
export const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceKey || 'placeholder-key'
);
