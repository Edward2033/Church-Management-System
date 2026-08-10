-- Migration: Add choir_director and other roles to constraints
-- Date: 2026-08-10
-- Purpose: Support choir director role and future role expansions

-- ==========================================
-- STEP 1: Update users table constraint
-- ==========================================
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('superadmin','admin','pastor','elder','deacon','leader',
                  'choir_director','choir_member','member','visitor'));

-- ==========================================
-- STEP 2: Update members table constraint
-- ==========================================
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_membership_status_check;
ALTER TABLE members ADD CONSTRAINT members_membership_status_check 
  CHECK (membership_status IN ('visitor','new_convert','member','choir_member',
                                'choir_director','leader','pastor','elder','deacon','admin'));

-- ==========================================
-- STEP 3: Update choir_members table
-- ==========================================
-- Add is_director column if it doesn't exist
ALTER TABLE choir_members 
ADD COLUMN IF NOT EXISTS is_director BOOLEAN DEFAULT FALSE;

-- Update choir_role constraint to match what backend uses
ALTER TABLE choir_members DROP CONSTRAINT IF EXISTS choir_members_choir_role_check;
ALTER TABLE choir_members ADD CONSTRAINT choir_members_choir_role_check
  CHECK (choir_role IN ('choir_director','director','assistant_director','music_director',
                        'worship_leader','secretary','treasurer','organist',
                        'pianist','drummer','choir_member'));

-- ==========================================
-- STEP 4: Data migration (optional)
-- ==========================================
-- Update any existing 'leader' roles in choir context to 'choir_director'
UPDATE users u
SET role = 'choir_director'
FROM members m
JOIN choir_members cm ON cm.member_id = m.id
WHERE u.id = m.user_id 
  AND u.role = 'leader' 
  AND (cm.is_director = TRUE OR cm.choir_role = 'choir_director');

UPDATE members m
SET membership_status = 'choir_director'
FROM choir_members cm
WHERE cm.member_id = m.id 
  AND m.membership_status = 'leader' 
  AND (cm.is_director = TRUE OR cm.choir_role = 'choir_director');

-- Update choir_members to use 'director' consistently
UPDATE choir_members 
SET choir_role = 'director', is_director = TRUE 
WHERE choir_role = 'choir_director';

-- ==========================================
-- Log migration
-- ==========================================
DO $$ 
BEGIN 
  RAISE NOTICE 'Migration 003 completed: Added choir_director role support';
  RAISE NOTICE '- Updated users.role constraint';
  RAISE NOTICE '- Updated members.membership_status constraint';  
  RAISE NOTICE '- Updated choir_members.choir_role constraint';
  RAISE NOTICE '- Added is_director column to choir_members';
END $$;
