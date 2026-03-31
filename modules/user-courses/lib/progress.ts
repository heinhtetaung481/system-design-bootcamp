import type { SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_COURSE_ID = 'system-design-bootcamp';
const PGRST_NO_ROWS = 'PGRST116';

export async function getCompletedTopics(
  supabase: SupabaseClient,
  userId: string,
  courseId: string = DEFAULT_COURSE_ID
): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_course_progress')
    .select('completed_topics')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single();

  if (error && error.code !== PGRST_NO_ROWS) {
    throw new Error(`progress read error: ${error.message}`);
  }

  return data?.completed_topics ?? [];
}

export async function markTopicComplete(
  supabase: SupabaseClient,
  userId: string,
  topicId: string,
  courseId: string = DEFAULT_COURSE_ID
): Promise<string[]> {
  // Fetch current progress
  const current = await getCompletedTopics(supabase, userId, courseId);

  if (current.includes(topicId)) return current;

  const updated = [...current, topicId];

  const { error } = await supabase
    .from('user_course_progress')
    .upsert(
      {
        user_id: userId,
        course_id: courseId,
        completed_topics: updated,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,course_id' }
    );

  if (error) {
    throw new Error(`progress write error: ${error.message}`);
  }

  return updated;
}

export async function unmarkTopicComplete(
  supabase: SupabaseClient,
  userId: string,
  topicId: string,
  courseId: string = DEFAULT_COURSE_ID
): Promise<string[]> {
  const current = await getCompletedTopics(supabase, userId, courseId);
  const updated = current.filter(id => id !== topicId);

  const { error } = await supabase
    .from('user_course_progress')
    .upsert(
      {
        user_id: userId,
        course_id: courseId,
        completed_topics: updated,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,course_id' }
    );

  if (error) {
    throw new Error(`progress write error: ${error.message}`);
  }

  return updated;
}
