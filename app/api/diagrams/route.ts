import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/modules/identity/lib/supabase-server';
import { listUserDiagrams, saveDiagram, deleteDiagram } from '@/modules/user-courses';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const diagrams = await listUserDiagrams(supabase, user.id);
    return NextResponse.json({ diagrams });
  } catch (error) {
    console.error('diagrams GET error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, topicId, topicTitle, mode, diagram, imageData } = await req.json();
  if (!title || !topicId || !topicTitle || !mode) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const saved = await saveDiagram(supabase, user.id, { title, topicId, topicTitle, mode, diagram, imageData });
    return NextResponse.json({ diagram: saved });
  } catch (error) {
    console.error('diagrams POST error:', error);
    return NextResponse.json({ error: 'Failed to save diagram' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing diagram id' }, { status: 400 });

  try {
    await deleteDiagram(supabase, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('diagrams DELETE error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
