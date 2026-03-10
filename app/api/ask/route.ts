import { NextRequest, NextResponse } from 'next/server';
import { generateAskResponse } from '@/lib/ai-providers';
import { ModelProvider } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { topicId, topicTitle, question, provider = 'anthropic' } = await req.json();

    if (!topicId || !topicTitle || !question) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate response
    const answer = await generateAskResponse(provider as ModelProvider, topicTitle, question);

    // Store in Supabase (best effort — skip if not configured)
    try {
      const { createServerSupabaseClient } = await import('@/lib/supabase');
      const supabase = createServerSupabaseClient();
      await supabase.from('ask_responses').insert({
        topic_id: topicId,
        model_provider: provider,
        question,
        answer,
      });
    } catch {
      // Supabase not configured, skip
    }

    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Ask error:', error);
    const message = error instanceof Error ? error.message : 'Failed to get response';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
