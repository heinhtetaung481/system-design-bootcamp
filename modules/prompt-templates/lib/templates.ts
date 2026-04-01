import { getSupabase } from '@/modules/identity';
import type { ModelOption } from '@/modules/prompt-templates/types';

const cache = new Map<string, { value: string; expiry: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

const REQUIRED_TEMPLATE_SLUGS = ['lesson', 'ask', 'diagram', 'models'] as const;

class TemplateNotFoundError extends Error {
  constructor(slug: string) {
    super(
      `Prompt template '${slug}' not found in database. ` +
      `Ensure migration has been run: npm run migrate`
    );
    this.name = 'TemplateNotFoundError';
  }
}

export async function getTemplate(slug: string, userId?: string): Promise<string> {
  if (!REQUIRED_TEMPLATE_SLUGS.includes(slug as typeof REQUIRED_TEMPLATE_SLUGS[number])) {
    throw new Error(`Unknown template slug: ${slug}`);
  }

  const cacheKey = `${slug}:${userId || 'system'}`;
  const now = Date.now();
  const cached = cache.get(cacheKey);
  if (cached && now < cached.expiry) return cached.value;

  const supabase = getSupabase();

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

  const { data } = await supabase
    .from('prompt_templates')
    .select('content')
    .eq('slug', slug)
    .is('user_id', null)
    .single();

  if (!data?.content) {
    throw new TemplateNotFoundError(slug);
  }

  cache.set(cacheKey, { value: data.content, expiry: now + CACHE_TTL_MS });
  return data.content;
}

export async function getModelOptions(userId?: string): Promise<ModelOption[]> {
  const content = await getTemplate('models', userId);
  try {
    return JSON.parse(content);
  } catch {
    throw new Error(
      'Failed to parse models template from database. ' +
      'The models template may be corrupted. ' +
      'Try re-running: npm run migrate'
    );
  }
}

export function invalidateTemplateCache() {
  cache.clear();
}
