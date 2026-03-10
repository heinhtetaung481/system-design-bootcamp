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

-- Optional: enable Row Level Security
-- ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ask_responses ENABLE ROW LEVEL SECURITY;

-- Allow public read access to lessons (cached content is not sensitive)
-- CREATE POLICY "Public read lessons" ON lessons FOR SELECT USING (true);
-- CREATE POLICY "Public insert lessons" ON lessons FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Public update lessons" ON lessons FOR UPDATE USING (true);
