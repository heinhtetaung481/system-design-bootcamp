-- Rollback: 20260401000001_curriculum_prompt_seed_rollback.sql
-- Description: Remove migration columns and seeded data from curriculum/prompt tables.

-- Remove seeded curriculum
DELETE FROM curriculum_versions WHERE label = 'v1' AND migrated_from_json = true;

-- Remove seeded prompt templates
DELETE FROM prompt_templates WHERE migrated_from_code = true;

-- Remove added columns (only if they exist)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'curriculum_versions' AND column_name = 'migrated_from_json'
  ) THEN
    ALTER TABLE curriculum_versions DROP COLUMN IF EXISTS migrated_from_json;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'curriculum_versions' AND column_name = 'content_hash'
  ) THEN
    ALTER TABLE curriculum_versions DROP COLUMN IF EXISTS content_hash;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'curriculum_versions' AND column_name = 'source_file'
  ) THEN
    ALTER TABLE curriculum_versions DROP COLUMN IF EXISTS source_file;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prompt_templates' AND column_name = 'migrated_from_code'
  ) THEN
    ALTER TABLE prompt_templates DROP COLUMN IF EXISTS migrated_from_code;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prompt_templates' AND column_name = 'original_order'
  ) THEN
    ALTER TABLE prompt_templates DROP COLUMN IF EXISTS original_order;
  END IF;
END
$$;

-- Remove index
DROP INDEX IF EXISTS idx_curriculum_single_active;

-- Remove trigger and function
DROP TRIGGER IF EXISTS trigger_ensure_system_default ON prompt_templates;
DROP FUNCTION IF EXISTS ensure_system_default_template();

-- Remove migration record
DELETE FROM schema_migrations WHERE version = '20260401000001';
