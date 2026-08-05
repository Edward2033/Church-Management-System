-- ============================================================================
-- Migration 010: Complete Notification and Attendance Management System
-- ============================================================================

-- Extend existing notifications table with new fields
ALTER TABLE notifications 
  ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal' 
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS attachment_url TEXT,
  ADD COLUMN IF NOT EXISTS publish_date TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft' 
    CHECK (status IN ('draft', 'scheduled', 'published', 'expired')),
  ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS delivered_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS read_count INTEGER DEFAULT 0;

-- Create notification delivery tracking table
CREATE TABLE IF NOT EXISTS notification_delivery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  delivered_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(notification_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_notif_delivery_notif ON notification_delivery(notification_id);
CREATE INDEX IF NOT EXISTS idx_notif_delivery_user ON notification_delivery(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_delivery_read ON notification_delivery(read_at) WHERE read_at IS NULL;

-- ============================================================================
-- ATTENDANCE MANAGEMENT SYSTEM
-- ============================================================================

-- Attendance sessions table
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  title VARCHAR(300) NOT NULL,
  attendance_type VARCHAR(50) NOT NULL CHECK (attendance_type IN (
    'sunday_service', 
    'midweek_service', 
    'friday_prayer',
    'choir_practice',
    'choir_rehearsal',
    'bible_study',
    'evangelism',
    'youth_meeting',
    'special_program',
    'other'
  )),
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  venue VARCHAR(300),
  description TEXT,
  invitation_verse TEXT,
  invitation_verse_reference VARCHAR(100),
  encouragement_message TEXT,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('draft', 'open', 'closed')),
  invitation_sent BOOLEAN DEFAULT FALSE,
  invitation_sent_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_sessions_church ON attendance_sessions(church_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_date ON attendance_sessions(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_type ON attendance_sessions(attendance_type);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_status ON attendance_sessions(status);

-- Attendance responses table
CREATE TABLE IF NOT EXISTS attendance_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  response VARCHAR(20) NOT NULL CHECK (response IN ('attending', 'not_attending', 'pending')),
  reason TEXT,
  comment TEXT,
  responded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_resp_session ON attendance_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_resp_user ON attendance_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_resp_church ON attendance_responses(church_id);
CREATE INDEX IF NOT EXISTS idx_attendance_resp_response ON attendance_responses(response);

-- ============================================================================
-- RECOGNITION SYSTEM
-- ============================================================================

-- Recognition categories and awards
CREATE TABLE IF NOT EXISTS recognitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(300) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN (
    'highest_attendance_member',
    'highest_attendance_choir',
    'most_consistent_member',
    'most_active_choir_member',
    'most_dedicated_volunteer',
    'custom'
  )),
  description TEXT NOT NULL,
  recognition_month DATE,
  attendance_percentage DECIMAL(5,2),
  is_published BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recognitions_church ON recognitions(church_id);
CREATE INDEX IF NOT EXISTS idx_recognitions_user ON recognitions(user_id);
CREATE INDEX IF NOT EXISTS idx_recognitions_published ON recognitions(is_published) WHERE is_published = TRUE;
CREATE INDEX IF NOT EXISTS idx_recognitions_date ON recognitions(recognition_month DESC);

-- ============================================================================
-- ATTENDANCE STATISTICS VIEW
-- ============================================================================

-- Create view for attendance statistics
CREATE OR REPLACE VIEW attendance_user_stats AS
SELECT 
  ar.user_id,
  ar.church_id,
  COUNT(*) as total_invitations,
  COUNT(CASE WHEN ar.response = 'attending' THEN 1 END) as attended_count,
  COUNT(CASE WHEN ar.response = 'not_attending' THEN 1 END) as declined_count,
  COUNT(CASE WHEN ar.response = 'pending' THEN 1 END) as pending_count,
  ROUND(
    (COUNT(CASE WHEN ar.response = 'attending' THEN 1 END)::DECIMAL / 
     NULLIF(COUNT(*), 0)) * 100, 
    2
  ) as attendance_percentage
FROM attendance_responses ar
GROUP BY ar.user_id, ar.church_id;

-- Create view for session statistics
CREATE OR REPLACE VIEW attendance_session_stats AS
SELECT 
  ar.session_id,
  ar.church_id,
  COUNT(*) as total_invited,
  COUNT(CASE WHEN ar.response = 'attending' THEN 1 END) as confirmed_count,
  COUNT(CASE WHEN ar.response = 'not_attending' THEN 1 END) as declined_count,
  COUNT(CASE WHEN ar.response = 'pending' THEN 1 END) as pending_count,
  ROUND(
    (COUNT(CASE WHEN ar.response = 'attending' THEN 1 END)::DECIMAL / 
     NULLIF(COUNT(*), 0)) * 100, 
    2
  ) as attendance_percentage,
  COUNT(CASE WHEN ar.response = 'attending' AND u.role = 'choir_member' THEN 1 END) as choir_confirmed,
  COUNT(CASE WHEN u.role = 'choir_member' THEN 1 END) as choir_invited
FROM attendance_responses ar
JOIN users u ON ar.user_id = u.id
GROUP BY ar.session_id, ar.church_id;

-- ============================================================================
-- SEED DATA: Sample encouragement templates
-- ============================================================================

-- Note: Bible verses for attendance invitations will be auto-generated 
-- by the system using the verse library from the verse generation job

COMMENT ON TABLE attendance_sessions IS 'Stores attendance sessions for various church events';
COMMENT ON TABLE attendance_responses IS 'Stores member responses to attendance invitations';
COMMENT ON TABLE recognitions IS 'Stores member recognition awards based on attendance and participation';
COMMENT ON TABLE notification_delivery IS 'Tracks notification delivery and read status for each user';

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to calculate and update notification read count
CREATE OR REPLACE FUNCTION update_notification_read_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.read_at IS NOT NULL AND OLD.read_at IS NULL THEN
    UPDATE notifications 
    SET read_count = read_count + 1
    WHERE id = NEW.notification_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update read count
DROP TRIGGER IF EXISTS trg_notification_read_count ON notification_delivery;
CREATE TRIGGER trg_notification_read_count
  AFTER UPDATE ON notification_delivery
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_read_count();

-- Function to auto-update attendance session timestamp
CREATE OR REPLACE FUNCTION update_attendance_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for attendance session updates
DROP TRIGGER IF EXISTS trg_attendance_session_updated ON attendance_sessions;
CREATE TRIGGER trg_attendance_session_updated
  BEFORE UPDATE ON attendance_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_attendance_session_timestamp();

-- ============================================================================
-- GRANTS (ensure proper permissions)
-- ============================================================================

-- Grant permissions on new tables
GRANT ALL ON attendance_sessions TO PUBLIC;
GRANT ALL ON attendance_responses TO PUBLIC;
GRANT ALL ON recognitions TO PUBLIC;
GRANT ALL ON notification_delivery TO PUBLIC;
GRANT SELECT ON attendance_user_stats TO PUBLIC;
GRANT SELECT ON attendance_session_stats TO PUBLIC;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Add helpful comments
COMMENT ON COLUMN notifications.priority IS 'Notification priority: low, normal, high, urgent';
COMMENT ON COLUMN notifications.status IS 'Notification status: draft, scheduled, published, expired';
COMMENT ON COLUMN attendance_sessions.attendance_type IS 'Type of attendance event';
COMMENT ON COLUMN attendance_responses.response IS 'User response: attending, not_attending, pending';
COMMENT ON COLUMN recognitions.category IS 'Type of recognition award';

