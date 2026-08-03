-- =============================================================
-- Migration 005: About Page CMS + Footer/Social CMS
-- Run in Supabase SQL editor
-- =============================================================

-- Core Values table (dynamic rows for About page)
CREATE TABLE IF NOT EXISTS about_values (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id   UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  title       VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  color_class VARCHAR(200) DEFAULT 'from-brand-600/30 to-brand-500/10 border-brand-500/30 text-brand-400',
  sort_order  INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_about_values_church ON about_values(church_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trg_about_values_updated ON about_values;
CREATE TRIGGER trg_about_values_updated
  BEFORE UPDATE ON about_values FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();

-- =============================================================
-- Seed default About page settings
-- =============================================================
INSERT INTO cms_settings (church_id, key, value, type, group_name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'about_hero_tag',        'Our Story',                                                    'text', 'about'),
  ('00000000-0000-0000-0000-000000000001', 'about_hero_title',      'About LUS4G Church',                                           'text', 'about'),
  ('00000000-0000-0000-0000-000000000001', 'about_hero_subtitle',   'A community of faith, love, and purpose — rooted in God''s word since 1985.', 'text', 'about'),
  ('00000000-0000-0000-0000-000000000001', 'about_hero_image',      '',                                                             'url',  'about'),
  ('00000000-0000-0000-0000-000000000001', 'about_intro_tag',       'Who We Are',                                                   'text', 'about'),
  ('00000000-0000-0000-0000-000000000001', 'about_intro_title',     'Our Journey of Faith',                                         'text', 'about'),
  ('00000000-0000-0000-0000-000000000001', 'about_intro_p1',        'Founded in 1985 by a small group of believers with a vision to see a generation transformed by the power of the Gospel, LUS4G Church has grown into a vibrant, multi-generational family of faith.', 'text', 'about'),
  ('00000000-0000-0000-0000-000000000001', 'about_intro_p2',        'Over the decades we''ve remained committed to our founding values — authentic worship, sound biblical teaching, genuine community, and compassionate outreach. Today we have over 2,000 active members across all age groups.', 'text', 'about'),
  ('00000000-0000-0000-0000-000000000001', 'about_intro_p3',        'We believe the church is not a building but a people, and we invite you to be part of this family.', 'text', 'about'),
  ('00000000-0000-0000-0000-000000000001', 'about_intro_image',     'https://images.unsplash.com/photo-1492321936769-b49830bc1d1e?w=800&q=80', 'url', 'about'),
  ('00000000-0000-0000-0000-000000000001', 'about_stat1_value',     '38+',                                                          'text', 'about'),
  ('00000000-0000-0000-0000-000000000001', 'about_stat1_label',     'Years of Ministry',                                            'text', 'about'),
  ('00000000-0000-0000-0000-000000000001', 'about_stat2_value',     '2K+',                                                          'text', 'about'),
  ('00000000-0000-0000-0000-000000000001', 'about_stat2_label',     'Active Members',                                               'text', 'about'),
  ('00000000-0000-0000-0000-000000000001', 'about_mission_title',   'Our Mission',                                                  'text', 'about'),
  ('00000000-0000-0000-0000-000000000001', 'about_mission_text',    'To make disciples of all people, building them up in the knowledge and love of God, and sending them out to transform every sphere of society with the Gospel.', 'text', 'about'),
  ('00000000-0000-0000-0000-000000000001', 'about_vision_title',    'Our Vision',                                                   'text', 'about'),
  ('00000000-0000-0000-0000-000000000001', 'about_vision_text',     'A church that reflects the diversity of heaven — every nation, tribe, and tongue worshipping and advancing God''s kingdom together.', 'text', 'about'),
  ('00000000-0000-0000-0000-000000000001', 'about_values_tag',      'What Drives Us',                                               'text', 'about'),
  ('00000000-0000-0000-0000-000000000001', 'about_values_title',    'Core Values',                                                  'text', 'about'),
  ('00000000-0000-0000-0000-000000000001', 'about_leadership_tag',  'Meet the Team',                                                'text', 'about'),
  ('00000000-0000-0000-0000-000000000001', 'about_leadership_title','Our Leadership',                                               'text', 'about'),
  ('00000000-0000-0000-0000-000000000001', 'about_leadership_sub',  'Serving with humility, vision, and a heart for God''s people.','text', 'about')
ON CONFLICT (church_id, key) DO NOTHING;

-- Seed default Footer settings
INSERT INTO cms_settings (church_id, key, value, type, group_name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'church_name',           'LUS4G Church',                                                 'text',  'footer'),
  ('00000000-0000-0000-0000-000000000001', 'church_tagline',        'One Family. One Faith. One Purpose.',                          'text',  'footer'),
  ('00000000-0000-0000-0000-000000000001', 'church_address',        '12 Grace Avenue, Accra',                                       'text',  'footer'),
  ('00000000-0000-0000-0000-000000000001', 'church_email',          'admin@lus4g.org',                                              'email', 'footer'),
  ('00000000-0000-0000-0000-000000000001', 'church_phone',          '+233 20 000 0001',                                             'text',  'footer'),
  ('00000000-0000-0000-0000-000000000001', 'footer_copyright',      'Built with faith & purpose',                                   'text',  'footer'),
  ('00000000-0000-0000-0000-000000000001', 'sunday_service_times',  '8AM · 10AM · 5PM',                                            'text',  'footer'),
  ('00000000-0000-0000-0000-000000000001', 'midweek_service',       'Wednesday 6:30 PM',                                            'text',  'footer'),
  ('00000000-0000-0000-0000-000000000001', 'prayer_meeting',        'Friday 7:00 PM',                                               'text',  'footer'),
  ('00000000-0000-0000-0000-000000000001', 'footer_ministries',     'Choir & Worship|Youth Fellowship|Children''s Church|Outreach|Prayer Ministry|Evangelism', 'text', 'footer')
ON CONFLICT (church_id, key) DO NOTHING;

-- Seed default Social settings
INSERT INTO cms_settings (church_id, key, value, type, group_name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'social_facebook',       '',  'url', 'social'),
  ('00000000-0000-0000-0000-000000000001', 'social_instagram',      '',  'url', 'social'),
  ('00000000-0000-0000-0000-000000000001', 'social_twitter',        '',  'url', 'social'),
  ('00000000-0000-0000-0000-000000000001', 'social_youtube',        '',  'url', 'social'),
  ('00000000-0000-0000-0000-000000000001', 'social_tiktok',         '',  'url', 'social'),
  ('00000000-0000-0000-0000-000000000001', 'social_whatsapp',       '',  'url', 'social')
ON CONFLICT (church_id, key) DO NOTHING;

-- Seed default Core Values
INSERT INTO about_values (church_id, title, description, color_class, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Love',      'We love God and each other unconditionally.',       'from-rose-600/30 to-rose-500/10 border-rose-500/30 text-rose-400',   0),
  ('00000000-0000-0000-0000-000000000001', 'Word',      'Built on the foundation of scripture.',             'from-blue-600/30 to-blue-500/10 border-blue-500/30 text-blue-400',   1),
  ('00000000-0000-0000-0000-000000000001', 'Community', 'We do life together as one family.',                'from-brand-600/30 to-brand-500/10 border-brand-500/30 text-brand-400', 2),
  ('00000000-0000-0000-0000-000000000001', 'Worship',   'Cultivating authentic praise and presence.',        'from-gold/30 to-gold/10 border-gold/30 text-gold',                   3)
ON CONFLICT DO NOTHING;
