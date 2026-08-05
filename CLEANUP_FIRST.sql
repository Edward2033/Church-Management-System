-- ============================================================================
-- CLEANUP SCRIPT - Run this FIRST to remove any existing conflicting objects
-- ============================================================================

-- Drop all existing views and triggers related to attendance
DROP VIEW IF EXISTS attendance_user_stats CASCADE;
DROP VIEW IF EXISTS attendance_session_stats CASCADE;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trg_notification_read_count ON notification_delivery;
DROP FUNCTION IF EXISTS update_notification_read_count() CASCADE;

-- Drop tables if they exist (to start fresh)
DROP TABLE IF EXISTS attendance_responses CASCADE;
DROP TABLE IF EXISTS attendance_sessions CASCADE;
DROP TABLE IF EXISTS recognitions CASCADE;
DROP TABLE IF EXISTS notification_delivery CASCADE;

SELECT 'Cleanup completed! Now run RUN_THIS_SECOND.sql' as status;
