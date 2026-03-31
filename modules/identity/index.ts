// NOTE: supabase-server.ts uses `next/headers` and CANNOT be re-exported here.
// Server-side consumers should import directly: @/modules/identity/lib/supabase-server
export { getSupabase, createServerSupabaseClient } from './lib/supabase';
export { createClient as createBrowserClient } from './lib/supabase-browser';
export { getUserSettings, updateUserSettings } from './lib/user-settings';
export type * from './types';
