import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/modules/identity/lib/supabase-server';
import { getCompletedTopics, markTopicComplete, unmarkTopicComplete } from '@/modules/user-courses';

// GET /api/progress?courseId=system-design-bootcamp
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const courseId = req.nextUrl.searchParams.get('courseId') || undefined;
  const completedTopics = await getCompletedTopics(supabase, user.id, courseId);
  return NextResponse.json({ completedTopics });
}

// POST /api/progress — { topicId, courseId?, action: 'complete' | 'uncomplete' }
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { topicId, courseId, action = 'complete' } = await req.json();
  if (!topicId) return NextResponse.json({ error: 'Missing topicId' }, { status: 400 });

  const completedTopics = action === 'uncomplete'
    ? await unmarkTopicComplete(supabase, user.id, topicId, courseId)
    : await markTopicComplete(supabase, user.id, topicId, courseId);

  return NextResponse.json({ completedTopics });
}
