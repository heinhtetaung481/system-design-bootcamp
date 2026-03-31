import { getSupabase } from '@/modules/identity';
import type { ModelOption } from '@/modules/prompt-templates/types';

// In-memory cache per slug — avoids DB round-trip per AI call
const cache = new Map<string, { value: string; expiry: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch a prompt template by slug.
 * Checks for a per-user override first, falls back to system default.
 * Returns null if not found (caller should use hardcoded fallback).
 */
export async function getTemplate(slug: string, userId?: string): Promise<string | null> {
  const cacheKey = `${slug}:${userId || 'system'}`;
  const now = Date.now();
  const cached = cache.get(cacheKey);
  if (cached && now < cached.expiry) return cached.value;

  try {
    const supabase = getSupabase();

    // If user is provided, try their override first
    if (userId) {
      const { data } = await supabase
        .from('prompt_templates')
        .select('content')
        .eq('slug', slug)
        .eq('user_id', userId)
        .single();

      if (data?.content) {
        cache.set(cacheKey, { value: data.content, expiry: now + CACHE_TTL_MS });
        return data.content;
      }
    }

    // Fall back to system default (user_id IS NULL)
    const { data } = await supabase
      .from('prompt_templates')
      .select('content')
      .eq('slug', slug)
      .is('user_id', null)
      .single();

    if (data?.content) {
      cache.set(cacheKey, { value: data.content, expiry: now + CACHE_TTL_MS });
      return data.content;
    }
  } catch {
    // DB unavailable — return null so caller uses hardcoded fallback
  }

  return null;
}

/** Get the model catalog from DB, or return the hardcoded default. */
export async function getModelOptions(userId?: string): Promise<ModelOption[]> {
  const content = await getTemplate('models', userId);
  if (content) {
    try { return JSON.parse(content); } catch { /* fall through */ }
  }
  // Hardcoded fallback
  return [
    { id: 'meta-llama/llama-4-scout:free', name: 'Llama 4 Scout', description: "Meta's Llama 4 Scout - free tier", color: '#7C3AED' },
    { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash', description: "Google's Gemini 2.0 Flash Experimental - free tier", color: '#1A73E8' },
    { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1', description: "DeepSeek R1 reasoning model - free tier", color: '#EF4444' },
    { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B', description: 'Mistral 7B Instruct - fast and free', color: '#F59E0B' },
  ];
}

/** Bust the template cache (e.g. after an update). */
export function invalidateTemplateCache() {
  cache.clear();
}
