import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { ModelProvider } from '@/types';

// PostgREST code for "no rows found" — expected when user has no settings yet
const PGRST_NO_ROWS = 'PGRST116';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('user_settings')
    .select('selected_model')
    .eq('user_id', user.id)
    .single();

  // Real DB error (not just "row not found")
  if (error && error.code !== PGRST_NO_ROWS) {
    console.error('user_settings GET error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json({ selectedModel: (data?.selected_model as ModelProvider) ?? null });
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

    const { error } = await supabase
      .from('user_settings')
      .upsert(
        { user_id: user.id, selected_model: selectedModel, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );

    if (error) {
      console.error('user_settings PUT error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save settings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
