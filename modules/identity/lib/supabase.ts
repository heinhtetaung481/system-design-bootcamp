import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy singleton for client-side / server-side non-auth contexts
let _supabase: SupabaseClient | null = null;
export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error('Supabase environment variables not set');
    _supabase = createClient(url, key);
  }
  return _supabase;
}

// Server-side client using service role key (bypasses RLS — for API routes only)
export function createServerSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase environment variables not set');
  return createClient(url, key);
}
