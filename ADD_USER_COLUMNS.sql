-- ============================================================================
-- ADD MISSING COLUMNS TO USERS TABLE
-- ============================================================================
-- This adds missing columns to users table for consistency with members
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Add missing columns to users table
DO $$ 
BEGIN
  -- Add first_name
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'first_name') THEN
    ALTER TABLE users ADD COLUMN first_name VARCHAR(100);
    
    -- Copy existing data from members table
    UPDATE users u
    SET first_name = m.first_name
    FROM members m
    WHERE u.id = m.user_id AND m.first_name IS NOT NULL;
  END IF;
  
  -- Add last_name
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_name') THEN
    ALTER TABLE users ADD COLUMN last_name VARCHAR(100);
    
    -- Copy existing data from members table
    UPDATE users u
    SET last_name = m.last_name
    FROM members m
    WHERE u.id = m.user_id AND m.last_name IS NOT NULL;
  END IF;
  
  -- Add profile_photo_url
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'profile_photo_url') THEN
    ALTER TABLE users ADD COLUMN profile_photo_url TEXT;
    
    -- Copy existing data from members table
    UPDATE users u
    SET profile_photo_url = m.profile_photo_url
    FROM members m
    WHERE u.id = m.user_id AND m.profile_photo_url IS NOT NULL;
  END IF;
  
  -- Add approval_status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'approval_status') THEN
    ALTER TABLE users ADD COLUMN approval_status VARCHAR(20) DEFAULT 'pending';
    
    -- Copy existing data from members table
    UPDATE users u
    SET approval_status = m.approval_status
    FROM members m
    WHERE u.id = m.user_id AND m.approval_status IS NOT NULL;
  END IF;
  
END $$;

-- Create trigger to keep users table in sync with members table
CREATE OR REPLACE FUNCTION sync_users_from_members()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET 
    first_name = NEW.first_name,
    last_name = NEW.last_name,
    profile_photo_url = NEW.profile_photo_url,
    approval_status = NEW.approval_status,
    updated_at = NOW()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_users_from_members ON members;
CREATE TRIGGER trg_sync_users_from_members
  AFTER UPDATE ON members
  FOR EACH ROW
  WHEN (
    OLD.first_name IS DISTINCT FROM NEW.first_name OR
    OLD.last_name IS DISTINCT FROM NEW.last_name OR
    OLD.profile_photo_url IS DISTINCT FROM NEW.profile_photo_url OR
    OLD.approval_status IS DISTINCT FROM NEW.approval_status
  )
  EXECUTE FUNCTION sync_users_from_members();

SELECT 'Users table columns added and sync trigger created successfully!' as status;
