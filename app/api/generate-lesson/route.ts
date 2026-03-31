import { NextRequest, NextResponse } from 'next/server';
import { generateLesson } from '@/modules/generation';
import { createServerSupabaseClient } from '@/modules/identity';
import { createClient } from '@/modules/identity/lib/supabase-server';
import { getUserApiKey } from '@/modules/identity';

export async function POST(req: NextRequest) {
  try {
    const { topicId, topicTitle, keyPoints, modelId, forceRegenerate = false } = await req.json();

    if (!topicId || !topicTitle || !keyPoints) {
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
      // Auth not available — fall through to admin key
    }
    if (!apiKey) apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'No OpenRouter API key configured' }, { status: 500 });
    }

    try {
      const supabase = createServerSupabaseClient();

      if (!forceRegenerate) {
        const { data: existingLesson } = await supabase
          .from('lessons')
          .select('content, created_at')
          .eq('topic_id', topicId)
          .eq('model_provider', modelId)
          .single();

        if (existingLesson?.content) {
          return NextResponse.json({
            content: existingLesson.content,
            cached: true,
            generatedAt: existingLesson.created_at,
          });
        }
      }

      const content = await generateLesson(modelId, apiKey, topicTitle, keyPoints);

      await supabase
        .from('lessons')
        .upsert(
          { topic_id: topicId, model_provider: modelId, content, updated_at: new Date().toISOString() },
          { onConflict: 'topic_id,model_provider' }
        );

      return NextResponse.json({ content, cached: false });
    } catch (supabaseError) {
      const content = await generateLesson(modelId, apiKey, topicTitle, keyPoints);
      return NextResponse.json({ content, cached: false });
    }
  } catch (error) {
    console.error('Generate lesson error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate lesson';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
