-- System Design Bootcamp — Supabase Schema
-- Run this in your Supabase SQL editor: https://supabase.com/dashboard → SQL Editor

-- Allowed users for GitHub OAuth login (whitelist)
-- Add rows here with the GitHub username or email of users you want to allow
CREATE TABLE IF NOT EXISTS allowed_users (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email           text        UNIQUE,
  github_username text        UNIQUE,
  created_at      timestamptz DEFAULT now()
);

-- Example: INSERT INTO allowed_users (github_username) VALUES ('your-github-username');
-- Example: INSERT INTO allowed_users (email) VALUES ('user@example.com');

-- Stores AI-generated lesson content (cached per topic + model provider)
CREATE TABLE IF NOT EXISTS lessons (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id      text        NOT NULL,
  model_provider text       NOT NULL DEFAULT 'anthropic',
  content       text        NOT NULL,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  UNIQUE(topic_id, model_provider)
);

-- Stores user progress (by session/browser fingerprint)
CREATE TABLE IF NOT EXISTS user_progress (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        text        NOT NULL UNIQUE,
  completed_topics  text[]      DEFAULT '{}',
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- Stores Q&A responses from the Ask AI tab
CREATE TABLE IF NOT EXISTS ask_responses (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id      text        NOT NULL,
  model_provider text       NOT NULL DEFAULT 'anthropic',
  question      text        NOT NULL,
  answer        text        NOT NULL,
  created_at    timestamptz DEFAULT now()
);

-- Stores per-user AI model preference
CREATE TABLE IF NOT EXISTS user_settings (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL UNIQUE,
  selected_model text        NOT NULL DEFAULT 'anthropic',
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

-- Row Level Security: each user can only read/write their own settings row.
-- Required because NEXT_PUBLIC_SUPABASE_ANON_KEY is exposed to the browser,
-- so without RLS any client could read or overwrite any other user's settings.
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

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

-- Storage bucket for diagram images (private — only owner can access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('diagrams', 'diagrams', false)
ON CONFLICT (id) DO NOTHING;

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

-- Curriculum content (versioned, one active row at a time)
CREATE TABLE IF NOT EXISTS curriculum_versions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  label       text        NOT NULL,
  content     jsonb       NOT NULL,
  is_active   boolean     NOT NULL DEFAULT false,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_curriculum_active ON curriculum_versions (is_active) WHERE is_active = true;

-- Prompt templates (system defaults + per-user overrides)
CREATE TABLE IF NOT EXISTS prompt_templates (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text        NOT NULL,
  title       text        NOT NULL,
  content     text        NOT NULL,
  user_id     uuid,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(slug, user_id)
);

CREATE INDEX idx_prompt_templates_slug ON prompt_templates (slug);
CREATE INDEX idx_prompt_templates_user ON prompt_templates (user_id) WHERE user_id IS NOT NULL;

ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read system defaults"
  ON prompt_templates FOR SELECT
  USING (user_id IS NULL);

CREATE POLICY "Users can read own template overrides"
  ON prompt_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own template overrides"
  ON prompt_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own template overrides"
  ON prompt_templates FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own template overrides"
  ON prompt_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Optional: enable Row Level Security on other tables
-- ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ask_responses ENABLE ROW LEVEL SECURITY;

-- Allow public read access to lessons (cached content is not sensitive)
-- CREATE POLICY "Public read lessons" ON lessons FOR SELECT USING (true);
-- CREATE POLICY "Public insert lessons" ON lessons FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Public update lessons" ON lessons FOR UPDATE USING (true);
