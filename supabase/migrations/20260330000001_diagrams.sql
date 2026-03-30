-- Migration: 20260330000001_diagrams
-- Description: Create diagrams table and storage bucket for user diagram persistence.

-- Stores diagram metadata (both MCP-generated and scratchpad sketches)
CREATE TABLE IF NOT EXISTS diagrams (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL,
  title       text        NOT NULL,
  topic_id    text        NOT NULL,
  topic_title text        NOT NULL,
  mode        text        NOT NULL CHECK (mode IN ('mcp', 'scratchpad')),
  diagram     jsonb,                       -- structured diagram data (MCP mode)
  image_path  text,                        -- storage path for scratchpad PNG
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_diagrams_user_id ON diagrams (user_id);

-- Row Level Security: each user can only access their own diagrams
ALTER TABLE diagrams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own diagrams"
  ON diagrams FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own diagrams"
  ON diagrams FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own diagrams"
  ON diagrams FOR DELETE
  USING (auth.uid() = user_id);

-- Storage bucket for diagram images (scratchpad PNGs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('diagrams', 'diagrams', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: users can only manage files in their own folder (user_id/*)
CREATE POLICY "Users can upload own diagram images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'diagrams'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can read own diagram images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'diagrams'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own diagram images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'diagrams'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
