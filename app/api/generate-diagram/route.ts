import { NextRequest, NextResponse } from 'next/server';
import { generateDiagram } from '@/modules/generation';
import { createClient } from '@/modules/identity/lib/supabase-server';
import { getUserApiKey } from '@/modules/identity';

export async function POST(req: NextRequest) {
  try {
    const { prompt, modelId } = await req.json();
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
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

    const raw = await generateDiagram(modelId, apiKey, prompt);
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
    const diagram = JSON.parse(cleaned);
    return NextResponse.json({ diagram });
  } catch (err) {
    console.error('generate-diagram error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate diagram' },
      { status: 500 }
    );
  }
}
