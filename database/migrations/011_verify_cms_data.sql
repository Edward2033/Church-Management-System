-- ═══════════════════════════════════════════════════════════════
-- Migration: 011 - Verify CMS Data and Seed Defaults
-- Description: Ensure all CMS tables have default data
-- Date: 2026-08-09
-- ═══════════════════════════════════════════════════════════════

-- Create about_values table if not exists
CREATE TABLE IF NOT EXISTS about_values (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id   UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  title       VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  color_class TEXT,
  sort_order  INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_about_values_church ON about_values(church_id);

-- Seed default About page settings (only if not exists)
INSERT INTO cms_settings (church_id, key, value, type, group_name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'about_hero_tag',        'Our Story',                                                    'text', 'about'),
  ('00000000-0000-0000-0000-000000000001', 'about_hero_title',      'About LUS4G Church',                                           'text', 'about'),
  ('00000000-0000-0000-0000-000000000001', 'about_hero_subtitle',   'A community of faith, love, and purpose.',                     'text', 'about'),
  ('00000000-0000-0000-0000-000000000001', 'about_intro_tag',       'Who We Are',                                                   'text', 'about'),
  ('00000000-0000-0000-0000-000000000001', 'about_intro_title',     'Our Journey of Faith',                                         'text', 'about'),
  ('00000000-0000-0000-0000-000000000001', 'about_intro_p1',        'For over 38 years, LUS4G Church has been a beacon of hope and love in our community. Founded on the principles of faith, service, and fellowship, we have grown from a small gathering into a vibrant family of believers.', 'text', 'about'),
  ('00000000-0000-0000-0000-000000000001', 'about_intro_p2',        'Our mission is to spread the Gospel of Jesus Christ through worship, discipleship, and community outreach. We believe in creating an atmosphere where everyone can encounter God''s presence and experience His transforming love.', 'text', 'about'),
  ('00000000-0000-0000-0000-000000000001', 'about_intro_p3',        'Whether you are seeking spiritual guidance, looking for a church family, or wanting to serve in ministry, LUS4G Church welcomes you with open arms.', 'text', 'about'),
  ('00000000-0000-0000-0000-000000000001', 'about_stat1_value',     '38+',                                                          'text', 'about'),
  ('00000000-0000-0000-0000-000000000001', 'about_stat1_label',     'Years of Ministry',                                            'text', 'about'),
  ('00000000-0000-0000-0000-000000000001', 'about_stat2_value',     '2K+',                                                          'text', 'about'),
  ('00000000-0000-0000-0000-000000000001', 'about_stat2_label',     'Active Members',                                               'text', 'about'),
  ('00000000-0000-0000-0000-000000000001', 'about_mission_title',   'Our Mission',                                                  'text', 'about'),
  ('00000000-0000-0000-0000-000000000001', 'about_mission_text',    'To proclaim the Gospel of Jesus Christ, make disciples, and serve our community with love and compassion. We strive to create a welcoming environment where lives are transformed through the power of God''s Word.', 'text', 'about'),
  ('00000000-0000-0000-0000-000000000001', 'about_vision_title',    'Our Vision',                                                   'text', 'about'),
  ('00000000-0000-0000-0000-000000000001', 'about_vision_text',     'To be a light in our generation, raising disciples who impact their communities for Christ. We envision a church where every member is equipped to serve, every family is strengthened, and every heart encounters the living God.', 'text', 'about'),
  ('00000000-0000-0000-0000-000000000001', 'about_values_tag',      'What Drives Us',                                               'text', 'about'),
  ('00000000-0000-0000-0000-000000000001', 'about_values_title',    'Core Values',                                                  'text', 'about'),
  ('00000000-0000-0000-0000-000000000001', 'about_leadership_tag',  'Meet the Team',                                                'text', 'about'),
  ('00000000-0000-0000-0000-000000000001', 'about_leadership_title','Our Leadership',                                               'text', 'about')
ON CONFLICT (church_id, key) DO NOTHING;

-- Seed default core values (only if none exist)
INSERT INTO about_values (church_id, title, description, color_class, sort_order) 
SELECT 
  '00000000-0000-0000-0000-000000000001',
  title,
  description,
  color_class,
  sort_order
FROM (VALUES
  ('Faith', 'We believe in the power of faith to transform lives and communities', 'from-brand-600/30 to-brand-500/10 border-brand-500/30 text-brand-400', 1),
  ('Love', 'We demonstrate God''s unconditional love in everything we do', 'from-rose-600/30 to-rose-500/10 border-rose-500/30 text-rose-400', 2),
  ('Service', 'We serve others as Jesus served, with humility and compassion', 'from-blue-600/30 to-blue-500/10 border-blue-500/30 text-blue-400', 3),
  ('Unity', 'We celebrate our diversity while maintaining unity in Christ', 'from-gold/30 to-gold/10 border-gold/30 text-gold', 4)
) AS v(title, description, color_class, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM about_values WHERE church_id = '00000000-0000-0000-0000-000000000001'
);

-- Seed default Contact settings (only if not exists)
INSERT INTO cms_settings (church_id, key, value, type, group_name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'contact_page_title',           'Contact Us',                                                  'text',    'contact'),
  ('00000000-0000-0000-0000-000000000001', 'contact_page_subtitle',        'We would love to hear from you. Reach out any time.',         'text',    'contact'),
  ('00000000-0000-0000-0000-000000000001', 'contact_address',              '123 Church Street, Accra, Ghana',                             'text',    'contact'),
  ('00000000-0000-0000-0000-000000000001', 'contact_phone',                '+233 XX XXX XXXX',                                            'text',    'contact'),
  ('00000000-0000-0000-0000-000000000001', 'contact_email',                'info@lus4gchurch.org',                                        'text',    'contact'),
  ('00000000-0000-0000-0000-000000000001', 'contact_office_hours',         'Mon - Fri: 9:00 AM - 5:00 PM',                                'text',    'contact'),
  ('00000000-0000-0000-0000-000000000001', 'contact_service1_label',       'First Service',                                               'text',    'contact'),
  ('00000000-0000-0000-0000-000000000001', 'contact_service1_time',        '7:30 AM',                                                     'text',    'contact'),
  ('00000000-0000-0000-0000-000000000001', 'contact_service2_label',       'Second Service',                                              'text',    'contact'),
  ('00000000-0000-0000-0000-000000000001', 'contact_service2_time',        '10:00 AM',                                                    'text',    'contact'),
  ('00000000-0000-0000-0000-000000000001', 'contact_midweek1_label',       'Wednesday Service',                                           'text',    'contact'),
  ('00000000-0000-0000-0000-000000000001', 'contact_midweek1_time',        '6:00 PM',                                                     'text',    'contact'),
  ('00000000-0000-0000-0000-000000000001', 'contact_form_enabled',         'true',                                                        'boolean', 'contact'),
  ('00000000-0000-0000-0000-000000000001', 'contact_success_message',      'Thank you! We will get back to you within 24 hours.',          'text',    'contact')
ON CONFLICT (church_id, key) DO NOTHING;

-- Seed default Footer settings (only if not exists)
INSERT INTO cms_settings (church_id, key, value, type, group_name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'footer_church_name',           'LUS4G Church',                                                 'text',  'footer'),
  ('00000000-0000-0000-0000-000000000001', 'footer_tagline',               'One Family. One Faith. One Purpose.',                          'text',  'footer'),
  ('00000000-0000-0000-0000-000000000001', 'footer_address',               '123 Church Street, Accra, Ghana',                              'text',  'footer'),
  ('00000000-0000-0000-0000-000000000001', 'footer_email',                 'info@lus4gchurch.org',                                         'text',  'footer'),
  ('00000000-0000-0000-0000-000000000001', 'footer_phone',                 '+233 XX XXX XXXX',                                             'text',  'footer'),
  ('00000000-0000-0000-0000-000000000001', 'footer_sunday_service',        '7:30 AM & 10:00 AM',                                           'text',  'footer'),
  ('00000000-0000-0000-0000-000000000001', 'footer_wednesday_service',     '6:00 PM',                                                      'text',  'footer'),
  ('00000000-0000-0000-0000-000000000001', 'footer_friday_service',        '6:00 PM',                                                      'text',  'footer'),
  ('00000000-0000-0000-0000-000000000001', 'footer_ministries',            'Youth Ministry|Women''s Fellowship|Men''s Fellowship|Choir Ministry|Children''s Church', 'text', 'footer')
ON CONFLICT (church_id, key) DO NOTHING;

-- Verify results
SELECT 
  'About Settings' as category,
  COUNT(*) as count
FROM cms_settings 
WHERE church_id = '00000000-0000-0000-0000-000000000001' 
  AND group_name = 'about'
UNION ALL
SELECT 
  'Contact Settings',
  COUNT(*)
FROM cms_settings 
WHERE church_id = '00000000-0000-0000-0000-000000000001' 
  AND group_name = 'contact'
UNION ALL
SELECT 
  'Footer Settings',
  COUNT(*)
FROM cms_settings 
WHERE church_id = '00000000-0000-0000-0000-000000000001' 
  AND group_name = 'footer'
UNION ALL
SELECT 
  'Core Values',
  COUNT(*)
FROM about_values 
WHERE church_id = '00000000-0000-0000-0000-000000000001';
