-- =============================================================
-- LUS4G CHURCH MANAGEMENT PLATFORM — UNIFIED SCHEMA
-- Combines: Church Management System + LUS4G Choir System
-- Database: PostgreSQL (Supabase)
-- Run: node backend/src/lib/initDb.js
-- =============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================
-- CHURCHES
-- =============================================================
CREATE TABLE IF NOT EXISTS churches (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(200) NOT NULL,
  slug          VARCHAR(100) UNIQUE NOT NULL,
  tagline       VARCHAR(300),
  address       TEXT,
  city          VARCHAR(100),
  country       VARCHAR(100) DEFAULT 'Ghana',
  phone         VARCHAR(30),
  email         VARCHAR(150),
  website       VARCHAR(200),
  logo_url      TEXT,
  description   TEXT,
  founded_year  INTEGER,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_churches_slug ON churches(slug);

-- =============================================================
-- USERS
-- =============================================================
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id       UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  email           VARCHAR(150) UNIQUE NOT NULL,
  password_hash   TEXT,
  password_set    BOOLEAN DEFAULT FALSE,
  role            VARCHAR(30) NOT NULL DEFAULT 'member'
                  CHECK (role IN ('superadmin','admin','pastor','elder','deacon','leader',
                                  'choir_member','member','visitor')),
  is_active       BOOLEAN DEFAULT TRUE,
  last_login      TIMESTAMPTZ,
  refresh_token   TEXT,
  refresh_expires TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_church ON users(church_id);
CREATE INDEX IF NOT EXISTS idx_users_email  ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role   ON users(role);

-- =============================================================
-- MEMBERS
-- =============================================================
CREATE TABLE IF NOT EXISTS members (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  church_id         UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  member_code       VARCHAR(20) UNIQUE,
  first_name        VARCHAR(100) NOT NULL,
  middle_name       VARCHAR(100),
  last_name         VARCHAR(100) NOT NULL,
  gender            VARCHAR(10) CHECK (gender IN ('Male','Female','Other')),
  date_of_birth     DATE,
  profile_photo_url TEXT,
  occupation        VARCHAR(150),
  marital_status    VARCHAR(20) CHECK (marital_status IN ('Single','Married','Divorced','Widowed')),
  phone             VARCHAR(30),
  whatsapp_number   VARCHAR(30),
  email             VARCHAR(150),
  address           TEXT,
  city              VARCHAR(100),
  membership_status VARCHAR(30) DEFAULT 'visitor'
                    CHECK (membership_status IN ('visitor','new_convert','member','choir_member',
                                                  'leader','pastor','elder','deacon')),
  baptism_status    BOOLEAN DEFAULT FALSE,
  baptism_date      DATE,
  date_joined       DATE DEFAULT CURRENT_DATE,
  department_id     UUID,
  emergency_name    VARCHAR(150),
  emergency_phone   VARCHAR(30),
  emergency_relation VARCHAR(50),
  bio               TEXT,
  approval_status   VARCHAR(20) DEFAULT 'pending'
                    CHECK (approval_status IN ('pending','approved','rejected','inactive')),
  approved_at       TIMESTAMPTZ,
  approved_by       UUID REFERENCES users(id),
  rejected_reason   TEXT,
  created_by        UUID REFERENCES users(id),
  updated_by        UUID REFERENCES users(id),
  deleted_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_members_church  ON members(church_id);
CREATE INDEX IF NOT EXISTS idx_members_user    ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_code    ON members(member_code);
CREATE INDEX IF NOT EXISTS idx_members_status  ON members(approval_status);
CREATE INDEX IF NOT EXISTS idx_members_dob     ON members(date_of_birth);
CREATE INDEX IF NOT EXISTS idx_members_deleted ON members(deleted_at);

-- =============================================================
-- DEPARTMENTS
-- =============================================================
CREATE TABLE IF NOT EXISTS departments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id   UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  name        VARCHAR(150) NOT NULL,
  description TEXT,
  leader_id   UUID REFERENCES members(id),
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_depts_church ON departments(church_id);

ALTER TABLE members ADD CONSTRAINT IF NOT EXISTS fk_members_dept
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- =============================================================
-- CHOIR MEMBERS (extends members)
-- =============================================================
CREATE TABLE IF NOT EXISTS choir_members (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id         UUID NOT NULL UNIQUE REFERENCES members(id) ON DELETE CASCADE,
  church_id         UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  choir_role        VARCHAR(50) DEFAULT 'choir_member'
                    CHECK (choir_role IN ('choir_director','assistant_director','music_director',
                                          'worship_leader','secretary','treasurer','organist',
                                          'pianist','drummer','choir_member')),
  voice_group       VARCHAR(20) CHECK (voice_group IN ('Soprano','Alto','Tenor','Bass')),
  experience_level  VARCHAR(30) CHECK (experience_level IN ('Beginner','Intermediate','Advanced','Professional')),
  instruments       TEXT[] DEFAULT '{}',
  choir_activities  TEXT[] DEFAULT '{}',
  main_role         VARCHAR(100),
  join_date         DATE DEFAULT CURRENT_DATE,
  is_active         BOOLEAN DEFAULT TRUE,
  approval_status   VARCHAR(20) DEFAULT 'pending'
                    CHECK (approval_status IN ('pending','approved','rejected')),
  approved_at       TIMESTAMPTZ,
  approved_by       UUID REFERENCES users(id),
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_choir_church ON choir_members(church_id);
CREATE INDEX IF NOT EXISTS idx_choir_member ON choir_members(member_id);

-- =============================================================
-- CHOIR BROADCASTS (from LUS4G system)
-- =============================================================
CREATE TABLE IF NOT EXISTS choir_broadcasts (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id  UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  message    TEXT NOT NULL,
  audience   VARCHAR(20) DEFAULT 'choir' CHECK (audience IN ('choir','all','leaders')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_broadcasts_church ON choir_broadcasts(church_id);

-- =============================================================
-- AUTH TOKENS
-- =============================================================
CREATE TABLE IF NOT EXISTS auth_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT UNIQUE NOT NULL,
  type        VARCHAR(30) NOT NULL
              CHECK (type IN ('account_setup','password_reset','email_verify')),
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tokens_user  ON auth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_tokens_token ON auth_tokens(token);

-- =============================================================
-- EVENTS
-- =============================================================
CREATE TABLE IF NOT EXISTS events (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id     UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  title         VARCHAR(300) NOT NULL,
  description   TEXT,
  category      VARCHAR(50) DEFAULT 'service'
                CHECK (category IN ('service','conference','crusade','retreat','choir_concert',
                                    'seminar','prayer','rehearsal','meeting','youth','general','church')),
  image_url     TEXT,
  event_date    DATE NOT NULL,
  start_time    TIME,
  end_time      TIME,
  location      VARCHAR(300),
  dress_code    VARCHAR(100),
  audience      VARCHAR(30) DEFAULT 'all'
                CHECK (audience IN ('all','members','choir','leaders')),
  capacity      INTEGER,
  requires_registration BOOLEAN DEFAULT FALSE,
  is_active     BOOLEAN DEFAULT TRUE,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_events_church ON events(church_id);
CREATE INDEX IF NOT EXISTS idx_events_date   ON events(event_date);

-- =============================================================
-- EVENT REGISTRATIONS / RSVP (merged from both systems)
-- =============================================================
CREATE TABLE IF NOT EXISTS event_registrations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  member_id       UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  unique_token    TEXT UNIQUE,
  status          VARCHAR(30) DEFAULT 'registered'
                  CHECK (status IN ('registered','attending','not_attending','attended','cancelled','no_show','pending')),
  absence_reason  TEXT,
  reminder_sent   BOOLEAN DEFAULT FALSE,
  token_expires_at TIMESTAMPTZ,
  checked_in_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, member_id)
);
CREATE INDEX IF NOT EXISTS idx_event_reg_event  ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_reg_member ON event_registrations(member_id);

-- =============================================================
-- ATTENDANCE
-- =============================================================
CREATE TABLE IF NOT EXISTS attendance (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id   UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  event_id    UUID REFERENCES events(id) ON DELETE SET NULL,
  member_id   UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  type        VARCHAR(50) DEFAULT 'sunday_service'
              CHECK (type IN ('sunday_service','midweek_service','prayer_meeting',
                              'choir_rehearsal','event','other')),
  status      VARCHAR(20) DEFAULT 'present'
              CHECK (status IN ('present','absent','excused','late')),
  check_in_method VARCHAR(20) DEFAULT 'manual'
              CHECK (check_in_method IN ('qr_code','manual','mobile')),
  notes       TEXT,
  recorded_by UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_attendance_church ON attendance(church_id);
CREATE INDEX IF NOT EXISTS idx_attendance_member ON attendance(member_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date   ON attendance(date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_unique ON attendance(member_id, date, type);

-- =============================================================
-- FINANCE CATEGORIES
-- =============================================================
CREATE TABLE IF NOT EXISTS finance_categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id   UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  type        VARCHAR(10) NOT NULL CHECK (type IN ('income','expense')),
  description TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fin_cat_church ON finance_categories(church_id);

-- =============================================================
-- FINANCE TRANSACTIONS
-- =============================================================
CREATE TABLE IF NOT EXISTS finance_transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id       UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  category_id     UUID REFERENCES finance_categories(id),
  member_id       UUID REFERENCES members(id),
  donor_name      VARCHAR(200),
  donor_email     VARCHAR(150),
  amount          NUMERIC(14,2) NOT NULL,
  currency        VARCHAR(5) DEFAULT 'GHS',
  type            VARCHAR(10) NOT NULL CHECK (type IN ('income','expense')),
  sub_type        VARCHAR(50),
  payment_method  VARCHAR(30) DEFAULT 'cash'
                  CHECK (payment_method IN ('cash','bank_transfer','mtn_momo','airtel_money',
                                            'paypal','card','cheque','mobile_money','other')),
  payment_ref     VARCHAR(200),
  payment_status  VARCHAR(20) DEFAULT 'completed'
                  CHECK (payment_status IN ('pending','completed','failed','refunded')),
  transaction_date DATE DEFAULT CURRENT_DATE,
  description     TEXT,
  receipt_number  VARCHAR(50),
  recorded_by     UUID REFERENCES users(id),
  created_by      UUID REFERENCES users(id),
  updated_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fin_tx_church ON finance_transactions(church_id);
CREATE INDEX IF NOT EXISTS idx_fin_tx_member ON finance_transactions(member_id);
CREATE INDEX IF NOT EXISTS idx_fin_tx_date   ON finance_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_fin_tx_type   ON finance_transactions(type);

-- =============================================================
-- NOTIFICATIONS
-- =============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id   UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  title       VARCHAR(300) NOT NULL,
  message     TEXT NOT NULL,
  type        VARCHAR(30) DEFAULT 'system'
              CHECK (type IN ('birthday','system','alert','announcement','event','finance','choir')),
  audience    VARCHAR(30) DEFAULT 'all'
              CHECK (audience IN ('all','members','choir','leaders','admin')),
  sender_id   UUID REFERENCES users(id),
  read_by     UUID[] DEFAULT '{}',
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notif_church  ON notifications(church_id);
CREATE INDEX IF NOT EXISTS idx_notif_created ON notifications(created_at DESC);

-- =============================================================
-- ANNOUNCEMENTS
-- =============================================================
CREATE TABLE IF NOT EXISTS announcements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id   UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  title       VARCHAR(300) NOT NULL,
  content     TEXT NOT NULL,
  category    VARCHAR(50) DEFAULT 'general'
              CHECK (category IN ('church','choir','events','general','finance','youth')),
  image_url   TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  pinned      BOOLEAN DEFAULT FALSE,
  audience    VARCHAR(30) DEFAULT 'all',
  author_id   UUID REFERENCES users(id),
  published_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_announce_church  ON announcements(church_id);
CREATE INDEX IF NOT EXISTS idx_announce_created ON announcements(created_at DESC);

-- =============================================================
-- GALLERY
-- =============================================================
CREATE TABLE IF NOT EXISTS gallery (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id   UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  title       VARCHAR(200),
  image_url   TEXT NOT NULL,
  category    VARCHAR(50) DEFAULT 'general'
              CHECK (category IN ('events','choir','worship','general','youth','leadership')),
  caption     TEXT,
  sort_order  INTEGER DEFAULT 0,
  uploaded_by UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gallery_church ON gallery(church_id);

-- =============================================================
-- SERMONS
-- =============================================================
CREATE TABLE IF NOT EXISTS sermons (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id        UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  title            VARCHAR(300) NOT NULL,
  speaker          VARCHAR(200),
  description      TEXT,
  scripture        VARCHAR(200),
  audio_url        TEXT,
  video_url        TEXT,
  thumbnail_url    TEXT,
  sermon_date      DATE,
  duration_minutes INTEGER,
  series           VARCHAR(200),
  tags             TEXT[],
  is_published     BOOLEAN DEFAULT FALSE,
  views            INTEGER DEFAULT 0,
  created_by       UUID REFERENCES users(id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sermons_church ON sermons(church_id);
CREATE INDEX IF NOT EXISTS idx_sermons_date   ON sermons(sermon_date DESC);

-- =============================================================
-- TESTIMONIALS
-- =============================================================
CREATE TABLE IF NOT EXISTS testimonials (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id   UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  member_id   UUID REFERENCES members(id),
  author_name VARCHAR(200),
  content     TEXT NOT NULL,
  photo_url   TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_testimonials_church ON testimonials(church_id);

-- =============================================================
-- PRAYER REQUESTS
-- =============================================================
CREATE TABLE IF NOT EXISTS prayer_requests (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id    UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  member_id    UUID REFERENCES members(id),
  subject      VARCHAR(300),
  request      TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT FALSE,
  is_answered  BOOLEAN DEFAULT FALSE,
  is_public    BOOLEAN DEFAULT FALSE,
  prayed_count INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_prayer_church ON prayer_requests(church_id);

-- =============================================================
-- CONTACT MESSAGES
-- =============================================================
CREATE TABLE IF NOT EXISTS contact_messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id   UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  name        VARCHAR(200) NOT NULL,
  email       VARCHAR(150) NOT NULL,
  phone       VARCHAR(30),
  subject     VARCHAR(300),
  message     TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT FALSE,
  is_replied  BOOLEAN DEFAULT FALSE,
  replied_by  UUID REFERENCES users(id),
  replied_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_contact_church ON contact_messages(church_id);

-- =============================================================
-- LEADERSHIP
-- =============================================================
CREATE TABLE IF NOT EXISTS leadership (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id   UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  name        VARCHAR(200) NOT NULL,
  title       VARCHAR(200) NOT NULL,
  bio         TEXT,
  photo_url   TEXT,
  email       VARCHAR(150),
  phone       VARCHAR(30),
  sort_order  INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_leadership_church ON leadership(church_id);
CREATE INDEX IF NOT EXISTS idx_leadership_order  ON leadership(sort_order);

-- =============================================================
-- DOCUMENTS
-- =============================================================
CREATE TABLE IF NOT EXISTS documents (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id   UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  title       VARCHAR(300) NOT NULL,
  description TEXT,
  file_url    TEXT NOT NULL,
  file_type   VARCHAR(50),
  file_size   BIGINT,
  category    VARCHAR(50) DEFAULT 'general'
              CHECK (category IN ('constitution','policy','minutes','manual','report','general')),
  version     VARCHAR(20) DEFAULT '1.0',
  is_public   BOOLEAN DEFAULT FALSE,
  uploaded_by UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_docs_church ON documents(church_id);

-- =============================================================
-- CMS TABLES
-- =============================================================
CREATE TABLE IF NOT EXISTS cms_pages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id   UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  slug        VARCHAR(100) NOT NULL,
  title       VARCHAR(300) NOT NULL,
  content     JSONB DEFAULT '{}',
  is_published BOOLEAN DEFAULT TRUE,
  updated_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(church_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_cms_church ON cms_pages(church_id);

CREATE TABLE IF NOT EXISTS cms_hero_slides (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id   UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  title       VARCHAR(300),
  subtitle    TEXT,
  image_url   TEXT NOT NULL,
  cta_label   VARCHAR(100),
  cta_url     VARCHAR(300),
  sort_order  INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hero_church ON cms_hero_slides(church_id);

CREATE TABLE IF NOT EXISTS cms_settings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id   UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  key         VARCHAR(100) NOT NULL,
  value       TEXT,
  type        VARCHAR(20) DEFAULT 'text'
              CHECK (type IN ('text','json','boolean','number','url','email')),
  group_name  VARCHAR(50),
  updated_by  UUID REFERENCES users(id),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(church_id, key)
);
CREATE INDEX IF NOT EXISTS idx_cms_settings_church ON cms_settings(church_id);

-- =============================================================
-- REHEARSALS (Choir)
-- =============================================================
CREATE TABLE IF NOT EXISTS rehearsals (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id      UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  title          VARCHAR(300) NOT NULL,
  description    TEXT,
  rehearsal_date DATE NOT NULL,
  start_time     TIME,
  end_time       TIME,
  location       VARCHAR(300),
  notes          TEXT,
  created_by     UUID REFERENCES users(id),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rehearsals_church ON rehearsals(church_id);
CREATE INDEX IF NOT EXISTS idx_rehearsals_date   ON rehearsals(rehearsal_date);

-- =============================================================
-- MUSIC LIBRARY
-- =============================================================
CREATE TABLE IF NOT EXISTS music_library (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id        UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  title            VARCHAR(300) NOT NULL,
  artist           VARCHAR(200),
  genre            VARCHAR(100),
  key_note         VARCHAR(10),
  bpm              INTEGER,
  file_url         TEXT,
  sheet_url        TEXT,
  lyrics           TEXT,
  duration_seconds INTEGER,
  tags             TEXT[],
  added_by         UUID REFERENCES users(id),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_music_church ON music_library(church_id);

-- =============================================================
-- CHOIR DUES
-- =============================================================
CREATE TABLE IF NOT EXISTS choir_dues (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id       UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  choir_member_id UUID NOT NULL REFERENCES choir_members(id) ON DELETE CASCADE,
  member_id       UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount          NUMERIC(14,2) NOT NULL,
  currency        VARCHAR(5) DEFAULT 'GHS',
  period          VARCHAR(20) NOT NULL,
  due_date        DATE,
  paid            BOOLEAN DEFAULT FALSE,
  paid_at         TIMESTAMPTZ,
  payment_method  VARCHAR(30) DEFAULT 'cash',
  payment_ref     VARCHAR(200),
  notes           TEXT,
  recorded_by     UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_choir_dues_church ON choir_dues(church_id);
CREATE INDEX IF NOT EXISTS idx_choir_dues_member ON choir_dues(choir_member_id);

-- =============================================================
-- AUDIT LOG
-- =============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id   UUID REFERENCES churches(id),
  user_id     UUID REFERENCES users(id),
  action      VARCHAR(100) NOT NULL,
  entity      VARCHAR(100),
  entity_id   UUID,
  old_data    JSONB,
  new_data    JSONB,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_church  ON audit_logs(church_id);
CREATE INDEX IF NOT EXISTS idx_audit_user    ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

-- =============================================================
-- TRIGGERS — auto update_updated_at
-- =============================================================
CREATE OR REPLACE FUNCTION fn_update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['churches','users','members','departments','choir_members',
    'events','finance_transactions','notifications','announcements','sermons',
    'documents','cms_pages','cms_hero_slides','rehearsals','leadership','cms_settings']
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%s_updated ON %s;
       CREATE TRIGGER trg_%s_updated
       BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();',
      tbl, tbl, tbl, tbl
    );
  END LOOP;
END; $$;

-- =============================================================
-- FUNCTIONS
-- =============================================================
CREATE OR REPLACE FUNCTION generate_member_code(p_church_id UUID, p_role VARCHAR)
RETURNS VARCHAR LANGUAGE plpgsql AS $$
DECLARE
  prefix   VARCHAR(5);
  next_num INTEGER;
  new_code VARCHAR(20);
BEGIN
  CASE p_role
    WHEN 'choir_member' THEN prefix := 'CHR';
    WHEN 'pastor'       THEN prefix := 'PST';
    WHEN 'elder'        THEN prefix := 'ELD';
    WHEN 'deacon'       THEN prefix := 'DCN';
    WHEN 'leader'       THEN prefix := 'LDR';
    WHEN 'admin'        THEN prefix := 'ADM';
    ELSE prefix := 'MBR';
  END CASE;
  SELECT COUNT(*) + 1 INTO next_num FROM members WHERE church_id = p_church_id;
  new_code := prefix || '-' || LPAD(next_num::TEXT, 4, '0');
  WHILE EXISTS (SELECT 1 FROM members WHERE member_code = new_code) LOOP
    next_num := next_num + 1;
    new_code := prefix || '-' || LPAD(next_num::TEXT, 4, '0');
  END LOOP;
  RETURN new_code;
END; $$;

CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS VARCHAR LANGUAGE plpgsql AS $$
BEGIN
  RETURN 'RCP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(uuid_generate_v4()::TEXT, 1, 6));
END; $$;

-- =============================================================
-- SEED: Default church record
-- =============================================================
INSERT INTO churches (id, name, slug, tagline, country, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'LUS4G Church',
  'lus4g',
  'Where Faith Meets Community',
  'Ghana',
  TRUE
) ON CONFLICT (id) DO NOTHING;
