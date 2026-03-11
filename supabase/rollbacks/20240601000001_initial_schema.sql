-- Rollback: 20240601000001_initial_schema
-- Description: Drop all tables and policies created in the initial schema migration.
-- WARNING: This is destructive — all data in these tables will be permanently lost.

-- Drop RLS policies before dropping the table
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can read own settings"   ON user_settings;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS user_settings;
DROP TABLE IF EXISTS ask_responses;
DROP TABLE IF EXISTS user_progress;
DROP TABLE IF EXISTS lessons;
DROP TABLE IF EXISTS allowed_users;
