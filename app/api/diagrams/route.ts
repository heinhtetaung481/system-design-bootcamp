import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// GET /api/diagrams — list the authenticated user's diagrams
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('diagrams')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('diagrams GET error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  // Generate signed URLs for scratchpad images
  const diagrams = await Promise.all(
    (data || []).map(async (d) => {
      let imageUrl: string | null = null;
      if (d.mode === 'scratchpad' && d.image_path) {
        const { data: urlData } = await supabase.storage
          .from('diagrams')
          .createSignedUrl(d.image_path, 3600); // 1 hour
        imageUrl = urlData?.signedUrl || null;
      }
      return {
        id: d.id,
        title: d.title,
        topicId: d.topic_id,
        topicTitle: d.topic_title,
        mode: d.mode,
        createdAt: d.created_at,
        diagram: d.diagram,
        imageUrl,
      };
    })
  );

  return NextResponse.json({ diagrams });
}

// POST /api/diagrams — save a new diagram
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { title, topicId, topicTitle, mode, diagram, imageData } = body;

  if (!title || !topicId || !topicTitle || !mode) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  let imagePath: string | null = null;

  // Upload scratchpad image to storage
  if (mode === 'scratchpad' && imageData) {
    // imageData is a data URL like "data:image/png;base64,..."
    const base64 = imageData.split(',')[1];
    if (!base64) {
      return NextResponse.json({ error: 'Invalid image data' }, { status: 400 });
    }
    const buffer = Buffer.from(base64, 'base64');
    const filename = `${user.id}/${Date.now()}.png`;

    const { error: uploadError } = await supabase.storage
      .from('diagrams')
      .upload(filename, buffer, {
        contentType: 'image/png',
        upsert: false,
      });

    if (uploadError) {
      console.error('diagram image upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
    }

    imagePath = filename;
  }

  // Insert diagram metadata
  const { data: inserted, error } = await supabase
    .from('diagrams')
    .insert({
      user_id: user.id,
      title,
      topic_id: topicId,
      topic_title: topicTitle,
      mode,
      diagram: mode === 'mcp' ? diagram : null,
      image_path: imagePath,
    })
    .select()
    .single();

  if (error) {
    console.error('diagrams POST error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  // Return the saved diagram with a signed URL if applicable
  let imageUrl: string | null = null;
  if (imagePath) {
    const { data: urlData } = await supabase.storage
      .from('diagrams')
      .createSignedUrl(imagePath, 3600);
    imageUrl = urlData?.signedUrl || null;
  }

  return NextResponse.json({
    diagram: {
      id: inserted.id,
      title: inserted.title,
      topicId: inserted.topic_id,
      topicTitle: inserted.topic_title,
      mode: inserted.mode,
      createdAt: inserted.created_at,
      diagram: inserted.diagram,
      imageUrl,
    },
  });
}

// DELETE /api/diagrams?id=<uuid> — delete a diagram
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing diagram id' }, { status: 400 });
  }

  // Fetch the diagram first to get the image path (RLS ensures ownership)
  const { data: existing } = await supabase
    .from('diagrams')
    .select('image_path')
    .eq('id', id)
    .single();

  // Delete from storage if there's an image
  if (existing?.image_path) {
    await supabase.storage.from('diagrams').remove([existing.image_path]);
  }

  // Delete the database row
  const { error } = await supabase
    .from('diagrams')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('diagrams DELETE error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
