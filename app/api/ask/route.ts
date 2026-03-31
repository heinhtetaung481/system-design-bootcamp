import { NextRequest, NextResponse } from 'next/server';
import { generateAskResponse } from '@/modules/generation';
import { createServerSupabaseClient } from '@/modules/identity';
import type { ModelProvider } from '@/modules/prompt-templates/types';

export async function POST(req: NextRequest) {
  try {
    const { topicId, topicTitle, question, provider = 'anthropic' } = await req.json();

    if (!topicId || !topicTitle || !question) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const answer = await generateAskResponse(provider as ModelProvider, topicTitle, question);

    // Store in Supabase (best effort)
    try {
      const supabase = createServerSupabaseClient();
      await supabase.from('ask_responses').insert({
        topic_id: topicId,
        model_provider: provider,
        question,
        answer,
      });
    } catch { /* Supabase not configured, skip */ }

    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Ask error:', error);
    const message = error instanceof Error ? error.message : 'Failed to get response';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
