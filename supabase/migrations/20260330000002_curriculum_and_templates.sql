-- Migration: 20260330000002_curriculum_and_templates
-- Description: Move curriculum content and AI prompt templates to DB for
--              easier editing, versioning, and future per-user customization.

-- ── Curriculum versions ──────────────────────────────────────────────────────
-- Each row is a complete curriculum snapshot (JSONB array of phases).
-- The "active" row is served to users. Old rows are kept for rollback.
CREATE TABLE IF NOT EXISTS curriculum_versions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  label       text        NOT NULL,          -- e.g. 'v1', '2026-Q1 update'
  content     jsonb       NOT NULL,          -- full Phase[] array
  is_active   boolean     NOT NULL DEFAULT false,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Only one row should be active at a time — enforced at app level
-- (a partial unique index would be cleaner but not all PG versions support it well)
CREATE INDEX idx_curriculum_active ON curriculum_versions (is_active) WHERE is_active = true;

-- ── Prompt templates ─────────────────────────────────────────────────────────
-- slug: unique key like 'lesson', 'ask', 'diagram', 'models'
-- user_id NULL = system default; non-null = per-user override
CREATE TABLE IF NOT EXISTS prompt_templates (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text        NOT NULL,
  title       text        NOT NULL,          -- human-readable label
  content     text        NOT NULL,          -- the prompt text (or JSON for models)
  user_id     uuid,                          -- NULL = system default
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(slug, user_id)
);

-- Fast lookup: system defaults (user_id IS NULL) and per-user overrides
CREATE INDEX idx_prompt_templates_slug ON prompt_templates (slug);
CREATE INDEX idx_prompt_templates_user ON prompt_templates (user_id) WHERE user_id IS NOT NULL;

-- RLS: everyone can read system defaults, users can read/write their own overrides
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read system defaults"
  ON prompt_templates FOR SELECT
  USING (user_id IS NULL);

CREATE POLICY "Users can read own overrides"
  ON prompt_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own overrides"
  ON prompt_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own overrides"
  ON prompt_templates FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own overrides"
  ON prompt_templates FOR DELETE
  USING (auth.uid() = user_id);
