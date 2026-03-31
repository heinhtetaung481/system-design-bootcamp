-- Migration: 20260331000002_openrouter_byok
-- Description: Add OpenRouter BYOK support — store the user's personal
--              OpenRouter API key in user_settings and seed the curated
--              OpenRouter model list into prompt_templates.

-- ── 1. user_settings: add openrouter_api_key column ─────────────────────────
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS openrouter_api_key text;

-- ── 2. prompt_templates: replace legacy models row with OpenRouter list ──────

-- Delete any existing system-default models entry (legacy Anthropic/OpenAI list)
DELETE FROM prompt_templates
  WHERE slug = 'models'
    AND user_id IS NULL;

-- Insert the curated OpenRouter model list
INSERT INTO prompt_templates (slug, title, content, user_id)
VALUES (
  'models',
  'Available Models',
  '[
    {
      "id": "meta-llama/llama-4-scout:free",
      "name": "Llama 4 Scout",
      "description": "Meta''s Llama 4 Scout - free tier",
      "color": "#7C3AED"
    },
    {
      "id": "google/gemini-2.0-flash-exp:free",
      "name": "Gemini 2.0 Flash",
      "description": "Google''s Gemini 2.0 Flash Experimental - free tier",
      "color": "#1A73E8"
    },
    {
      "id": "deepseek/deepseek-r1:free",
      "name": "DeepSeek R1",
      "description": "DeepSeek R1 reasoning model - free tier",
      "color": "#EF4444"
    },
    {
      "id": "mistralai/mistral-7b-instruct:free",
      "name": "Mistral 7B",
      "description": "Mistral 7B Instruct - fast and free",
      "color": "#F59E0B"
    }
  ]',
  NULL
)
ON CONFLICT (slug, user_id) DO UPDATE
  SET content    = EXCLUDED.content,
      updated_at = NOW();
