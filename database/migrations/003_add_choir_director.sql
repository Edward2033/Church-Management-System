-- Migration: Add is_director field to choir_members table
-- This allows marking one choir member as the official choir director

ALTER TABLE choir_members 
ADD COLUMN IF NOT EXISTS is_director BOOLEAN DEFAULT FALSE;

-- Add unique constraint to ensure only one director per church (optional but recommended)
-- Note: This constraint allows multiple FALSE values but only one TRUE value per church
CREATE UNIQUE INDEX IF NOT EXISTS idx_choir_director_unique 
ON choir_members (church_id, is_director) 
WHERE is_director = TRUE;

-- Add comment
COMMENT ON COLUMN choir_members.is_director IS 'Indicates if this choir member is the official choir director';
