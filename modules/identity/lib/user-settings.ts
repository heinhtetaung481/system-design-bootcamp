import type { SupabaseClient } from '@supabase/supabase-js';
import type { ModelProvider } from '@/modules/prompt-templates/types';

const PGRST_NO_ROWS = 'PGRST116';

export async function getUserSettings(supabase: SupabaseClient, userId: string): Promise<ModelProvider | null> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('selected_model')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== PGRST_NO_ROWS) {
    throw new Error(`user_settings read error: ${error.message}`);
  }

  return (data?.selected_model as ModelProvider) ?? null;
}

export async function updateUserSettings(
  supabase: SupabaseClient,
  userId: string,
  selectedModel: ModelProvider
): Promise<void> {
  const { error } = await supabase
    .from('user_settings')
    .upsert(
      { user_id: userId, selected_model: selectedModel, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );

  if (error) {
    throw new Error(`user_settings write error: ${error.message}`);
  }
}

export async function getUserApiKey(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('openrouter_api_key')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== PGRST_NO_ROWS) {
    throw new Error(`user_settings read error: ${error.message}`);
  }
  return data?.openrouter_api_key ?? null;
}

export async function updateUserApiKey(
  supabase: SupabaseClient,
  userId: string,
  apiKey: string | null
): Promise<void> {
  const { error } = await supabase
    .from('user_settings')
    .upsert(
      { user_id: userId, openrouter_api_key: apiKey, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
  if (error) throw new Error(`user_settings write error: ${error.message}`);
}
