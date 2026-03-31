import type { SupabaseClient } from '@supabase/supabase-js';
import type { SavedDiagram, GeneratedDiagram } from '@/modules/user-courses/types';

export async function listUserDiagrams(
  supabase: SupabaseClient,
  userId: string
): Promise<SavedDiagram[]> {
  const { data, error } = await supabase
    .from('diagrams')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`diagrams list error: ${error.message}`);

  return Promise.all(
    (data || []).map(async (d) => {
      let imageUrl: string | undefined;
      if (d.mode === 'scratchpad' && d.image_path) {
        const { data: urlData } = await supabase.storage
          .from('diagrams')
          .createSignedUrl(d.image_path, 3600);
        imageUrl = urlData?.signedUrl || undefined;
      }
      return {
        id: d.id,
        title: d.title,
        topicId: d.topic_id,
        topicTitle: d.topic_title,
        mode: d.mode,
        createdAt: d.created_at,
        diagram: d.diagram as GeneratedDiagram | undefined,
        imageUrl,
      };
    })
  );
}

export async function saveDiagram(
  supabase: SupabaseClient,
  userId: string,
  params: {
    title: string;
    topicId: string;
    topicTitle: string;
    mode: 'mcp' | 'scratchpad';
    diagram?: GeneratedDiagram;
    imageData?: string; // base64 data URL
  }
): Promise<SavedDiagram> {
  let imagePath: string | null = null;

  // Upload scratchpad image to storage
  if (params.mode === 'scratchpad' && params.imageData) {
    const base64 = params.imageData.split(',')[1];
    if (!base64) throw new Error('Invalid image data');

    const buffer = Buffer.from(base64, 'base64');
    const filename = `${userId}/${Date.now()}.png`;

    const { error: uploadError } = await supabase.storage
      .from('diagrams')
      .upload(filename, buffer, { contentType: 'image/png', upsert: false });

    if (uploadError) throw new Error(`image upload error: ${uploadError.message}`);
    imagePath = filename;
  }

  const { data: inserted, error } = await supabase
    .from('diagrams')
    .insert({
      user_id: userId,
      title: params.title,
      topic_id: params.topicId,
      topic_title: params.topicTitle,
      mode: params.mode,
      diagram: params.mode === 'mcp' ? params.diagram : null,
      image_path: imagePath,
    })
    .select()
    .single();

  if (error) throw new Error(`diagram save error: ${error.message}`);

  let imageUrl: string | undefined;
  if (imagePath) {
    const { data: urlData } = await supabase.storage
      .from('diagrams')
      .createSignedUrl(imagePath, 3600);
    imageUrl = urlData?.signedUrl || undefined;
  }

  return {
    id: inserted.id,
    title: inserted.title,
    topicId: inserted.topic_id,
    topicTitle: inserted.topic_title,
    mode: inserted.mode,
    createdAt: inserted.created_at,
    diagram: inserted.diagram as GeneratedDiagram | undefined,
    imageUrl,
  };
}

export async function deleteDiagram(
  supabase: SupabaseClient,
  diagramId: string
): Promise<void> {
  // Fetch diagram to get image path (RLS ensures ownership)
  const { data: existing } = await supabase
    .from('diagrams')
    .select('image_path')
    .eq('id', diagramId)
    .single();

  if (existing?.image_path) {
    await supabase.storage.from('diagrams').remove([existing.image_path]);
  }

  const { error } = await supabase
    .from('diagrams')
    .delete()
    .eq('id', diagramId);

  if (error) throw new Error(`diagram delete error: ${error.message}`);
}
