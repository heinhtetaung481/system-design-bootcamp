-- Migration: 20260331000001_user_course_progress
-- Description: Track per-user, per-course completed topics in the database
--              instead of localStorage. Supports multiple courses per user.

CREATE TABLE IF NOT EXISTS user_course_progress (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        NOT NULL,
  course_id         text        NOT NULL DEFAULT 'system-design-bootcamp',
  completed_topics  text[]      DEFAULT '{}',
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),
  UNIQUE(user_id, course_id)
);

CREATE INDEX idx_user_course_progress_user ON user_course_progress (user_id);

ALTER TABLE user_course_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own progress"
  ON user_course_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON user_course_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_course_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
