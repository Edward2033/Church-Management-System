-- Migration: Expand events category constraint to match frontend categories
-- Run this against your Supabase database

-- Drop the existing CHECK constraint on events.category
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_category_check;

-- Re-add with all categories used by the frontend
ALTER TABLE events ADD CONSTRAINT events_category_check
  CHECK (category IN (
    'service','conference','crusade','retreat','choir_concert',
    'seminar','prayer','rehearsal','meeting',
    'youth','general','church','worship','outreach'
  ));
