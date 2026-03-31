import { NextRequest, NextResponse } from 'next/server';
import { generateAskResponse } from '@/modules/generation';
import { createServerSupabaseClient } from '@/modules/identity';
import { createClient } from '@/modules/identity/lib/supabase-server';
import { getUserApiKey } from '@/modules/identity';

export async function POST(req: NextRequest) {
  try {
    const { topicId, topicTitle, question, modelId } = await req.json();

    if (!topicId || !topicTitle || !question) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!modelId) {
      return NextResponse.json({ error: 'modelId is required' }, { status: 400 });
    }

    // Resolve API key: user's own key takes priority over admin key
    let apiKey: string | undefined;
    try {
      const supabaseAuth = await createClient();
      const { data: { user } } = await supabaseAuth.auth.getUser();
      if (user) {
        const userKey = await getUserApiKey(supabaseAuth, user.id);
        if (userKey) apiKey = userKey;
      }
    } catch {
      // Fall through to admin key
    }
    if (!apiKey) apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'No OpenRouter API key configured' }, { status: 500 });
    }

    const answer = await generateAskResponse(modelId, apiKey, topicTitle, question);

    try {
      const supabase = createServerSupabaseClient();
      await supabase.from('ask_responses').insert({
        topic_id: topicId,
        model_provider: modelId,
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
