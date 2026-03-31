import { NextRequest, NextResponse } from 'next/server';
import { generateLesson } from '@/modules/generation';
import { createServerSupabaseClient } from '@/modules/identity';
import type { ModelProvider } from '@/modules/prompt-templates/types';

export async function POST(req: NextRequest) {
  try {
    const { topicId, topicTitle, keyPoints, provider = 'anthropic', forceRegenerate = false } = await req.json();

    if (!topicId || !topicTitle || !keyPoints) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    try {
      const supabase = createServerSupabaseClient();

      if (!forceRegenerate) {
        const { data: existingLesson } = await supabase
          .from('lessons')
          .select('content, created_at')
          .eq('topic_id', topicId)
          .eq('model_provider', provider)
          .single();

        if (existingLesson?.content) {
          return NextResponse.json({
            content: existingLesson.content,
            cached: true,
            generatedAt: existingLesson.created_at,
          });
        }
      }

      const content = await generateLesson(provider as ModelProvider, topicTitle, keyPoints);

      await supabase
        .from('lessons')
        .upsert(
          { topic_id: topicId, model_provider: provider, content, updated_at: new Date().toISOString() },
          { onConflict: 'topic_id,model_provider' }
        );

      return NextResponse.json({ content, cached: false });
    } catch (supabaseError) {
      const content = await generateLesson(provider as ModelProvider, topicTitle, keyPoints);
      return NextResponse.json({ content, cached: false });
    }
  } catch (error) {
    console.error('Generate lesson error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate lesson';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
