-- Migration: Add choir_director and other roles to constraints
-- Date: 2026-08-10
-- Purpose: Support choir director role and future role expansions

-- Drop existing constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_membership_status_check;

-- Add updated constraint to users table with choir_director
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('superadmin','admin','pastor','elder','deacon','leader',
                  'choir_director','choir_member','member','visitor'));

-- Add updated constraint to members table with choir_director
ALTER TABLE members ADD CONSTRAINT members_membership_status_check 
  CHECK (membership_status IN ('visitor','new_convert','member','choir_member',
                                'choir_director','leader','pastor','elder','deacon','admin'));

-- Update any existing 'leader' roles in choir context to 'choir_director'
-- This is optional - only if you want to migrate existing choir leaders
UPDATE users u
SET role = 'choir_director'
FROM members m
JOIN choir_members cm ON cm.member_id = m.id
WHERE u.id = m.user_id 
  AND u.role = 'leader' 
  AND cm.is_director = TRUE;

UPDATE members m
SET membership_status = 'choir_director'
FROM choir_members cm
WHERE cm.member_id = m.id 
  AND m.membership_status = 'leader' 
  AND cm.is_director = TRUE;

-- Log migration
DO $$ 
BEGIN 
  RAISE NOTICE 'Migration 003: Added choir_director role to constraints';
END $$;
