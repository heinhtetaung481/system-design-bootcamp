import { Phase } from '@/modules/curriculum/types';
import { getSupabase } from '@/modules/identity';

// In-memory cache with TTL — avoids DB round-trip on every page load
let cachedCurriculum: Phase[] | null = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Returns the active curriculum from Supabase.
 * Falls back to the static JSON file if DB is unavailable.
 */
export async function getCurriculum(): Promise<Phase[]> {
  const now = Date.now();
  if (cachedCurriculum && now < cacheExpiry) return cachedCurriculum;

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('curriculum_versions')
      .select('content')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (!error && data?.content) {
      cachedCurriculum = data.content as Phase[];
      cacheExpiry = now + CACHE_TTL_MS;
      return cachedCurriculum;
    }
  } catch {
    // DB unavailable — fall through to static fallback
  }

  // Fallback: static JSON (always works, even without DB)
  const staticData = (await import('./curriculum-data.json')).default as Phase[];
  cachedCurriculum = staticData;
  cacheExpiry = now + CACHE_TTL_MS;
  return staticData;
}

/** Bust the curriculum cache (e.g. after an admin update). */
export function invalidateCurriculumCache() {
  cachedCurriculum = null;
  cacheExpiry = 0;
}

export async function getAllTopics() {
  const curriculum = await getCurriculum();
  const topics: Array<Phase['weeks'][0]['topics'][0] & {
    phaseTitle: string;
    phaseColor: string;
    weekTitle: string;
  }> = [];
  curriculum.forEach(p =>
    p.weeks.forEach(w =>
      w.topics.forEach(t =>
        topics.push({ ...t, phaseTitle: p.phaseTitle, phaseColor: p.phaseColor, weekTitle: w.weekTitle })
      )
    )
  );
  return topics;
}

export async function getTopicById(id: string) {
  const topics = await getAllTopics();
  return topics.find(t => t.id === id);
}
