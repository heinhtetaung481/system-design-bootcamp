# Curriculum & Prompt Template Database Migration

## Overview

This migration moves all Curriculum data and Prompt Templates from JSON file storage and hardcoded code to the database. The seed data is included directly in the SQL migration file, making this a single atomic operation.

## What Changed

### Before
- **Curriculum**: Stored in `modules/curriculum/lib/curriculum-data.json`
- **Prompt Templates**: Hardcoded in `modules/generation/lib/fallback-prompts.ts`
- Application read from JSON/Code with fallback behavior

### After
- **Curriculum**: Stored in `curriculum_versions` table
- **Prompt Templates**: Stored in `prompt_templates` table
- Application reads exclusively from database

## Schema

### curriculum_versions

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| label | text | Version label (e.g., 'v1') |
| content | jsonb | Full Phase[] array |
| is_active | boolean | Whether this version is served |
| source_file | text | Original JSON source file |
| migrated_from_json | boolean | Tracks migration origin |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

### prompt_templates

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| slug | text | Template identifier |
| title | text | Human-readable name |
| content | text | Prompt text or JSON |
| user_id | uuid | NULL for system defaults |
| migrated_from_code | boolean | Tracks migration origin |
| original_order | integer | Import order |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

## Running the Migration

```bash
# Apply all pending migrations (including seed data)
npm run migrate

# Check status
npm run migrate:status

# Rollback last migration
npm run migrate:down
```

The seed data is included in the SQL migration file and runs automatically when the migration is applied.

## Code Changes

### curriculum-db.ts

Removed JSON fallback - now throws descriptive error if database is unavailable:

```typescript
export async function getCurriculum(): Promise<Phase[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('curriculum_versions')
    .select('content')
    .eq('is_active', true)
    .single();

  if (error || !data?.content) {
    throw new Error(
      'Failed to load curriculum from database. ' +
      'Ensure migration has been run: npm run migrate'
    );
  }
  return data.content;
}
```

### templates.ts

Removed hardcoded fallback - now throws `TemplateNotFoundError`:

```typescript
export async function getTemplate(slug: string): Promise<string> {
  const { data } = await supabase
    .from('prompt_templates')
    .select('content')
    .eq('slug', slug)
    .single();

  if (!data?.content) {
    throw new TemplateNotFoundError(slug);
  }
  return data.content;
}
```

## Idempotency

The migration is idempotent:
- Uses `CREATE TABLE IF NOT EXISTS` for tables
- Uses `CREATE INDEX IF NOT EXISTS` for indexes
- Uses `INSERT ... ON CONFLICT DO UPDATE` for seed data
- Safe to run multiple times

## Rollback

To rollback:

```bash
npm run migrate:down
```

This removes the tables and all migrated data. The rollback script is in `supabase/rollbacks/`.

## Verification

After migration, verify data was seeded correctly:

```sql
-- Check curriculum
SELECT label, is_active FROM curriculum_versions;

-- Check templates
SELECT slug, title FROM prompt_templates WHERE user_id IS NULL;
```

## Troubleshooting

### "Failed to load curriculum from database"

1. Ensure migration was run: `npm run migrate`
2. Check database connection
3. Verify active curriculum exists:
   ```sql
   SELECT * FROM curriculum_versions WHERE is_active = true;
   ```

### "Prompt template 'X' not found"

1. Ensure migration was run: `npm run migrate`
2. Check templates exist:
   ```sql
   SELECT slug FROM prompt_templates WHERE user_id IS NULL;
   ```

## Changelog

### Added
- `curriculum_versions` table with content versioning
- `prompt_templates` table with system defaults and per-user override support
- Seed data included in migration SQL

### Changed
- `curriculum-db.ts`: Removed JSON fallback
- `templates.ts`: Removed hardcoded fallback
- `generation-service.ts`: Uses DB exclusively

### Removed
- JSON file fallback for curriculum
- Hardcoded prompt template fallbacks
