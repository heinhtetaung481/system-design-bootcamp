-- Rollback: 20260330000001_diagrams

-- Remove storage policies
DROP POLICY IF EXISTS "Users can upload own diagram images" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own diagram images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own diagram images" ON storage.objects;

-- Remove storage bucket (must delete objects first in production)
DELETE FROM storage.buckets WHERE id = 'diagrams';

-- Remove table (cascades policies and index)
DROP TABLE IF EXISTS diagrams;
