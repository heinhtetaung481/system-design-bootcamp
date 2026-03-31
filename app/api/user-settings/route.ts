import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/modules/identity/lib/supabase-server';
import { getUserSettings, updateUserSettings, getUserApiKey, updateUserApiKey } from '@/modules/identity';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const selectedModel = await getUserSettings(supabase, user.id);
    const openrouterApiKey = await getUserApiKey(supabase, user.id);
    // Mask the key — only return whether one exists, and last 4 chars for UX confirmation
    const maskedKey = openrouterApiKey
      ? `sk-or-...${openrouterApiKey.slice(-4)}`
      : null;
    return NextResponse.json({ selectedModel, openrouterApiKey: maskedKey, hasOwnKey: !!openrouterApiKey });
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

    const body = await req.json();

    // Update model preference
    if (body.selectedModel !== undefined) {
      if (!body.selectedModel || typeof body.selectedModel !== 'string') {
        return NextResponse.json({ error: 'Invalid model' }, { status: 400 });
      }
      await updateUserSettings(supabase, user.id, body.selectedModel);
    }

    // Update API key (null = remove key)
    if ('openrouterApiKey' in body) {
      const key = body.openrouterApiKey;
      if (key !== null && typeof key !== 'string') {
        return NextResponse.json({ error: 'Invalid API key' }, { status: 400 });
      }
      await updateUserApiKey(supabase, user.id, key || null);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save settings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
