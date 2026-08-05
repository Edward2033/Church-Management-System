-- ============================================================================
-- FRESH INSTALLATION - Run this AFTER running CLEANUP_FIRST.sql
-- ============================================================================

-- STEP 1: Extend notifications table
-- ============================================================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'priority') THEN
    ALTER TABLE notifications ADD COLUMN priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'image_url') THEN
    ALTER TABLE notifications ADD COLUMN image_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'attachment_url') THEN
    ALTER TABLE notifications ADD COLUMN attachment_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'publish_date') THEN
    ALTER TABLE notifications ADD COLUMN publish_date TIMESTAMPTZ DEFAULT NOW();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'expiry_date') THEN
    ALTER TABLE notifications ADD COLUMN expiry_date TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'status') THEN
    ALTER TABLE notifications ADD COLUMN status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'expired'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'email_sent') THEN
    ALTER TABLE notifications ADD COLUMN email_sent BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'delivered_count') THEN
    ALTER TABLE notifications ADD COLUMN delivered_count INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'read_count') THEN
    ALTER TABLE notifications ADD COLUMN read_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- STEP 2: Create notification delivery table
-- ============================================================================
CREATE TABLE notification_delivery (
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

CREATE INDEX idx_notif_delivery_notif ON notification_delivery(notification_id);
CREATE INDEX idx_notif_delivery_user ON notification_delivery(user_id);

-- STEP 3: Create attendance_sessions table
-- ============================================================================
CREATE TABLE attendance_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  title VARCHAR(300) NOT NULL,
  attendance_type VARCHAR(50) NOT NULL CHECK (attendance_type IN (
    'sunday_service', 'midweek_service', 'friday_prayer', 'choir_practice',
    'choir_rehearsal', 'bible_study', 'evangelism', 'youth_meeting',
    'special_program', 'other'
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

CREATE INDEX idx_attendance_sessions_church ON attendance_sessions(church_id);
CREATE INDEX idx_attendance_sessions_date ON attendance_sessions(event_date DESC);

-- STEP 4: Create attendance_responses table
-- ============================================================================
CREATE TABLE attendance_responses (
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

CREATE INDEX idx_attendance_resp_session ON attendance_responses(session_id);
CREATE INDEX idx_attendance_resp_user ON attendance_responses(user_id);

-- STEP 5: Create recognitions table
-- ============================================================================
CREATE TABLE recognitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(300) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN (
    'highest_attendance_member', 'highest_attendance_choir',
    'most_consistent_member', 'most_active_choir_member',
    'most_dedicated_volunteer', 'custom'
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

CREATE INDEX idx_recognitions_church ON recognitions(church_id);
CREATE INDEX idx_recognitions_user ON recognitions(user_id);

-- STEP 6: Create views (NOW session_id column definitely exists)
-- ============================================================================
CREATE VIEW attendance_user_stats AS
SELECT 
  ar.user_id,
  ar.church_id,
  COUNT(*) as total_invitations,
  COUNT(CASE WHEN ar.response = 'attending' THEN 1 END) as attended_count,
  COUNT(CASE WHEN ar.response = 'not_attending' THEN 1 END) as declined_count,
  COUNT(CASE WHEN ar.response = 'pending' THEN 1 END) as pending_count,
  ROUND(
    (COUNT(CASE WHEN ar.response = 'attending' THEN 1 END)::DECIMAL / 
     NULLIF(COUNT(*), 0)) * 100, 2
  ) as attendance_percentage
FROM attendance_responses ar
GROUP BY ar.user_id, ar.church_id;

CREATE VIEW attendance_session_stats AS
SELECT 
  ar.session_id,
  ar.church_id,
  COUNT(*) as total_invited,
  COUNT(CASE WHEN ar.response = 'attending' THEN 1 END) as confirmed_count,
  COUNT(CASE WHEN ar.response = 'not_attending' THEN 1 END) as declined_count,
  COUNT(CASE WHEN ar.response = 'pending' THEN 1 END) as pending_count,
  ROUND(
    (COUNT(CASE WHEN ar.response = 'attending' THEN 1 END)::DECIMAL / 
     NULLIF(COUNT(*), 0)) * 100, 2
  ) as attendance_percentage
FROM attendance_responses ar
GROUP BY ar.session_id, ar.church_id;

-- STEP 7: Create trigger function and trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION update_notification_read_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.read_at IS NOT NULL AND (OLD.read_at IS NULL OR OLD.read_at != NEW.read_at) THEN
    UPDATE notifications 
    SET read_count = read_count + 1
    WHERE id = NEW.notification_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notification_read_count
  AFTER UPDATE ON notification_delivery
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_read_count();

-- STEP 8: Grant permissions
-- ============================================================================
GRANT SELECT ON attendance_user_stats TO anon, authenticated;
GRANT SELECT ON attendance_session_stats TO anon, authenticated;

-- ALL DONE!
-- ============================================================================
SELECT 
  'Migration completed successfully!' as status,
  'All tables created: notification_delivery, attendance_sessions, attendance_responses, recognitions' as tables,
  'All views created: attendance_user_stats, attendance_session_stats' as views,
  'Trigger created: trg_notification_read_count' as trigger;
