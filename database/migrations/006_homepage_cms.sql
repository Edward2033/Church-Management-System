-- =============================================================
-- Migration 006: Homepage CMS Tables
-- Run in Supabase SQL editor
-- =============================================================

-- Homepage statistics (strip below hero)
CREATE TABLE IF NOT EXISTS homepage_stats (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id   UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  value       VARCHAR(50)  NOT NULL,
  label       VARCHAR(100) NOT NULL,
  icon        VARCHAR(50)  DEFAULT 'users',
  sort_order  INTEGER      DEFAULT 0,
  is_active   BOOLEAN      DEFAULT TRUE,
  created_at  TIMESTAMPTZ  DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hp_stats_church ON homepage_stats(church_id);
DROP TRIGGER IF EXISTS trg_homepage_stats_updated ON homepage_stats;
CREATE TRIGGER trg_homepage_stats_updated
  BEFORE UPDATE ON homepage_stats FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();

-- "Why Join" feature cards
CREATE TABLE IF NOT EXISTS homepage_features (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id   UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  icon        VARCHAR(50)  DEFAULT 'heart',
  title       VARCHAR(150) NOT NULL,
  description TEXT         NOT NULL,
  sort_order  INTEGER      DEFAULT 0,
  is_active   BOOLEAN      DEFAULT TRUE,
  created_at  TIMESTAMPTZ  DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hp_features_church ON homepage_features(church_id);
DROP TRIGGER IF EXISTS trg_homepage_features_updated ON homepage_features;
CREATE TRIGGER trg_homepage_features_updated
  BEFORE UPDATE ON homepage_features FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();

-- Service times
CREATE TABLE IF NOT EXISTS homepage_service_times (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id   UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  day         VARCHAR(50)  NOT NULL,
  name        VARCHAR(150) NOT NULL,
  times       TEXT[]       DEFAULT '{}',
  description TEXT,
  icon        VARCHAR(50)  DEFAULT 'calendar',
  sort_order  INTEGER      DEFAULT 0,
  is_active   BOOLEAN      DEFAULT TRUE,
  created_at  TIMESTAMPTZ  DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hp_services_church ON homepage_service_times(church_id);
DROP TRIGGER IF EXISTS trg_homepage_services_updated ON homepage_service_times;
CREATE TRIGGER trg_homepage_services_updated
  BEFORE UPDATE ON homepage_service_times FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();

-- =============================================================
-- Seed: homepage cms_settings (welcome + CTA sections)
-- =============================================================
INSERT INTO cms_settings (church_id, key, value, type, group_name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'home_welcome_enabled',    'true',                                                          'boolean', 'home'),
  ('00000000-0000-0000-0000-000000000001', 'home_welcome_tag',        'Welcome to Our Family',                                         'text',    'home'),
  ('00000000-0000-0000-0000-000000000001', 'home_welcome_title',      'Where Faith Meets Community',                                   'text',    'home'),
  ('00000000-0000-0000-0000-000000000001', 'home_welcome_text',       'A place to worship, grow, serve, and belong — rooted in God''s word and love. Join thousands of believers on a journey of faith, purpose, and community.', 'text', 'home'),
  ('00000000-0000-0000-0000-000000000001', 'home_welcome_btn1_label', 'Join Our Family',                                               'text',    'home'),
  ('00000000-0000-0000-0000-000000000001', 'home_welcome_btn1_url',   '/register',                                                     'text',    'home'),
  ('00000000-0000-0000-0000-000000000001', 'home_welcome_btn2_label', 'Learn More',                                                    'text',    'home'),
  ('00000000-0000-0000-0000-000000000001', 'home_welcome_btn2_url',   '/about',                                                        'text',    'home'),
  ('00000000-0000-0000-0000-000000000001', 'home_welcome_image',      'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800&q=80', 'url', 'home'),
  ('00000000-0000-0000-0000-000000000001', 'home_stats_enabled',      'true',                                                          'boolean', 'home'),
  ('00000000-0000-0000-0000-000000000001', 'home_features_enabled',   'true',                                                          'boolean', 'home'),
  ('00000000-0000-0000-0000-000000000001', 'home_features_tag',       'Our Ministries',                                                'text',    'home'),
  ('00000000-0000-0000-0000-000000000001', 'home_features_title',     'Why Join Our Church Family?',                                   'text',    'home'),
  ('00000000-0000-0000-0000-000000000001', 'home_features_subtitle',  'A place to worship, grow, serve, and belong — rooted in God''s word and love.', 'text', 'home'),
  ('00000000-0000-0000-0000-000000000001', 'home_services_enabled',   'true',                                                          'boolean', 'home'),
  ('00000000-0000-0000-0000-000000000001', 'home_services_tag',       'Come Worship With Us',                                          'text',    'home'),
  ('00000000-0000-0000-0000-000000000001', 'home_services_title',     'Service Times',                                                 'text',    'home'),
  ('00000000-0000-0000-0000-000000000001', 'home_announce_enabled',   'true',                                                          'boolean', 'home'),
  ('00000000-0000-0000-0000-000000000001', 'home_announce_limit',     '3',                                                             'number',  'home'),
  ('00000000-0000-0000-0000-000000000001', 'home_announce_tag',       'Stay Informed',                                                 'text',    'home'),
  ('00000000-0000-0000-0000-000000000001', 'home_announce_title',     'Latest Announcements',                                          'text',    'home'),
  ('00000000-0000-0000-0000-000000000001', 'home_events_enabled',     'true',                                                          'boolean', 'home'),
  ('00000000-0000-0000-0000-000000000001', 'home_events_limit',       '3',                                                             'number',  'home'),
  ('00000000-0000-0000-0000-000000000001', 'home_events_tag',         'What''s Happening',                                             'text',    'home'),
  ('00000000-0000-0000-0000-000000000001', 'home_events_title',       'Church Activities',                                             'text',    'home'),
  ('00000000-0000-0000-0000-000000000001', 'home_cta_enabled',        'true',                                                          'boolean', 'home'),
  ('00000000-0000-0000-0000-000000000001', 'home_cta_tag',            'Join Our Family',                                               'text',    'home'),
  ('00000000-0000-0000-0000-000000000001', 'home_cta_title',          'Ready to Be Part of Something Greater?',                        'text',    'home'),
  ('00000000-0000-0000-0000-000000000001', 'home_cta_text',           'Register today and become part of a vibrant, loving community of believers growing together in faith.', 'text', 'home'),
  ('00000000-0000-0000-0000-000000000001', 'home_cta_btn1_label',     'Register Now',                                                  'text',    'home'),
  ('00000000-0000-0000-0000-000000000001', 'home_cta_btn1_url',       '/register',                                                     'text',    'home'),
  ('00000000-0000-0000-0000-000000000001', 'home_cta_btn2_label',     'Contact Us',                                                    'text',    'home'),
  ('00000000-0000-0000-0000-000000000001', 'home_cta_btn2_url',       '/contact',                                                      'text',    'home'),
  ('00000000-0000-0000-0000-000000000001', 'home_cta_image',          '',                                                              'url',     'home')
ON CONFLICT (church_id, key) DO NOTHING;

-- =============================================================
-- Seed: default stats
-- =============================================================
INSERT INTO homepage_stats (church_id, value, label, icon, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000001', '2,000+', 'Active Members',    'users',    0),
  ('00000000-0000-0000-0000-000000000001', '38+',    'Years of Ministry', 'calendar', 1),
  ('00000000-0000-0000-0000-000000000001', '12+',    'Ministries',        'heart',    2),
  ('00000000-0000-0000-0000-000000000001', '1',      'Church Family',     'church',   3)
ON CONFLICT DO NOTHING;

-- =============================================================
-- Seed: default features
-- =============================================================
INSERT INTO homepage_features (church_id, icon, title, description, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000001', 'heart',       'Worship & Praise',       'Experience powerful, spirit-filled worship every Sunday with our dedicated choir and worship team.',                    0),
  ('00000000-0000-0000-0000-000000000001', 'music',       'Choir Ministry',         'Join our vibrant choir — soprano, alto, tenor, and bass voices united in praise and harmony.',                          1),
  ('00000000-0000-0000-0000-000000000001', 'users',       'Community & Fellowship', 'Build lasting friendships and grow together through life groups, events, and shared ministry.',                          2),
  ('00000000-0000-0000-0000-000000000001', 'bell',        'Stay Connected',         'Receive announcements, event reminders, and birthday celebrations directly to your dashboard.',                          3),
  ('00000000-0000-0000-0000-000000000001', 'cake',        'Celebrate Together',     'We honour every member on their birthday and celebrate life milestones as one family.',                                  4),
  ('00000000-0000-0000-0000-000000000001', 'shield-check', 'Safe & Welcoming',      'A secure, inclusive space where every person is known, valued, and cared for by name.',                                  5)
ON CONFLICT DO NOTHING;

-- =============================================================
-- Seed: default service times
-- =============================================================
INSERT INTO homepage_service_times (church_id, day, name, times, icon, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Sunday',    'Sunday Services',    ARRAY['First Service 8:00 AM','Second Service 10:00 AM','Evening Service 5:00 PM'], 'calendar', 0),
  ('00000000-0000-0000-0000-000000000001', 'Wednesday', 'Bible Study',        ARRAY['Bible Study 6:30 PM'],                                                       'book',     1),
  ('00000000-0000-0000-0000-000000000001', 'Friday',    'Prayer & Rehearsal', ARRAY['Prayer Meeting 7:00 PM','Choir Rehearsal 6:00 PM'],                          'music',    2)
ON CONFLICT DO NOTHING;
