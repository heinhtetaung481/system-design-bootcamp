import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { ModelProvider } from '@/types';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data } = await supabase
      .from('user_settings')
      .select('selected_model')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({ selectedModel: (data?.selected_model as ModelProvider) ?? null });
  } catch {
    return NextResponse.json({ selectedModel: null });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { selectedModel } = await req.json();

    if (!['anthropic', 'openai'].includes(selectedModel)) {
      return NextResponse.json({ error: 'Invalid model' }, { status: 400 });
    }

    await supabase
      .from('user_settings')
      .upsert(
        { user_id: user.id, selected_model: selectedModel, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save settings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
