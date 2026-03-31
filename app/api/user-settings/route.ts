import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/modules/identity/lib/supabase-server';
import { getUserSettings, updateUserSettings } from '@/modules/identity';
import type { ModelProvider } from '@/modules/prompt-templates/types';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const selectedModel = await getUserSettings(supabase, user.id);
    return NextResponse.json({ selectedModel });
  } catch (error) {
    console.error('user_settings GET error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { selectedModel } = await req.json();
    if (!['anthropic', 'openai'].includes(selectedModel)) {
      return NextResponse.json({ error: 'Invalid model' }, { status: 400 });
    }

    await updateUserSettings(supabase, user.id, selectedModel as ModelProvider);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save settings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
