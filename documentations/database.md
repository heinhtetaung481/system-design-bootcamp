# Database Architecture

The application uses PostgreSQL, provided by Supabase.

## Key Tables & Schema

1. **`allowed_users`**
   - **Purpose:** Acts as a whitelist for GitHub OAuth login. Only users listed here can access the application.
   - **Fields:** `id`, `email`, `github_username`, `created_at`.

2. **`lessons`**
   - **Purpose:** Caches the AI-generated lesson content. By storing this locally, the application avoids redundant calls to the AI providers.
   - **Fields:** `id`, `topic_id`, `model_provider`, `content`, `created_at`, `updated_at`.
   - **Constraint:** Unique across `(topic_id, model_provider)`.

3. **`user_progress`**
   - **Purpose:** Tracks the progression of a user (or session/browser fingerprint) through the curriculum topics.
   - **Fields:** `id`, `session_id`, etc.

4. **`ask_responses`**
   - **Purpose:** Best-effort storage caching the answers returned by the Q&A "Ask" system.
   - **Fields:** `id`, `topic_id`, `model_provider`, `question`, `answer`, `created_at`.

5. **`curriculum_versions`**
   - **Purpose:** Holds versioned snapshots (JSONB array) of the entire curriculum (phases/topics). Allows dynamic delivery and rollback.
   - **Fields:** `id`, `label`, `content`, `is_active`, `created_at`, `updated_at`.
   - **Index:** A partial unique index ensures only one row is active at any time.

6. **`prompt_templates`**
   - **Purpose:** Database-driven prompt templates for varying domains (`lesson`, `ask`, `diagram`, etc.). Allows per-user overrides.
   - **Fields:** `id`, `slug`, `title`, `content`, `user_id`, `created_at`.

## AI Caching Strategy
Most tables (like `lessons`, `ask_responses`) are geared towards capturing AI-generated outputs. When a topic is requested, the system first checks the `lessons` table for existing content for that specific `topic_id` and `model_provider`. If a match is found, the cached content is served directly to the user (alongside a `cached: true` flag), bypassing expensive API requests.