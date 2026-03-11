-- Migration: 20240601000001_initial_schema
-- Description: Create initial schema — allowed_users, lessons, user_progress,
--              ask_responses, user_settings with RLS policies.

-- Allowed users for GitHub OAuth login (whitelist)
CREATE TABLE IF NOT EXISTS allowed_users (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email           text        UNIQUE,
  github_username text        UNIQUE,
  created_at      timestamptz DEFAULT now()
);

-- Stores AI-generated lesson content (cached per topic + model provider)
CREATE TABLE IF NOT EXISTS lessons (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id       text        NOT NULL,
  model_provider text        NOT NULL DEFAULT 'anthropic',
  content        text        NOT NULL,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now(),
  UNIQUE(topic_id, model_provider)
);

-- Stores user progress (by session/browser fingerprint)
CREATE TABLE IF NOT EXISTS user_progress (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       text        NOT NULL UNIQUE,
  completed_topics text[]      DEFAULT '{}',
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- Stores Q&A responses from the Ask AI tab
CREATE TABLE IF NOT EXISTS ask_responses (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id       text        NOT NULL,
  model_provider text        NOT NULL DEFAULT 'anthropic',
  question       text        NOT NULL,
  answer         text        NOT NULL,
  created_at     timestamptz DEFAULT now()
);

-- Stores per-user AI model preference
CREATE TABLE IF NOT EXISTS user_settings (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL UNIQUE,
  selected_model text        NOT NULL DEFAULT 'anthropic',
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

-- Row Level Security: each user can only read/write their own settings row
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
