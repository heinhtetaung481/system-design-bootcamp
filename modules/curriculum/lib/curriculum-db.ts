import { Phase } from '@/modules/curriculum/types';
import { getSupabase } from '@/modules/identity';

let cachedCurriculum: Phase[] | null = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function getCurriculum(): Promise<Phase[]> {
  const now = Date.now();
  if (cachedCurriculum && now < cacheExpiry) return cachedCurriculum;

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('curriculum_versions')
    .select('content')
    .eq('is_active', true)
    .limit(1)
    .single();

  if (error || !data?.content) {
    throw new Error(
      'Failed to load curriculum from database. ' +
      'Ensure migration has been run: npm run seed:curriculum'
    );
  }

  cachedCurriculum = data.content as Phase[];
  cacheExpiry = now + CACHE_TTL_MS;
  return cachedCurriculum;
}

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

export async function getCurriculumVersion() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('curriculum_versions')
    .select('id, label, created_at, is_active')
    .eq('is_active', true)
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}
