import { NextRequest, NextResponse } from 'next/server';
import { generateDiagram } from '@/modules/generation';
import type { ModelProvider } from '@/modules/prompt-templates/types';

export async function POST(req: NextRequest) {
  try {
    const { prompt, provider } = await req.json();
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }
    const raw = await generateDiagram((provider as ModelProvider) || 'anthropic', prompt);
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
