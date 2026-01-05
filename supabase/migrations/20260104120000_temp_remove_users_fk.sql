-- ⚠️ TEMPORARY MIGRATION
-- Purpose: Remove foreign key constraint on users.id to allow creating users without Auth
-- This is a temporary workaround while Auth is disabled
-- TODO: Restore this constraint when Auth is re-enabled

-- Drop the foreign key constraint
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Add a comment to remind us this is temporary
COMMENT ON TABLE public.users IS '⚠️ TEMPORARY: Foreign key to auth.users has been removed. Restore it when Auth is enabled.';

