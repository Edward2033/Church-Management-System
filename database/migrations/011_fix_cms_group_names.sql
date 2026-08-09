-- =============================================================
-- Migration 011: Fix cms_settings group_name for existing rows
-- Root cause: PUT /cms/settings was not persisting group_name,
-- so admin-saved rows had NULL group_name and were invisible to
-- GET /cms/settings?group=contact|footer|social|about|branding
-- =============================================================

-- Fix NULL group_name for all existing rows by inferring from key prefix
UPDATE cms_settings SET group_name = 'contact'  WHERE group_name IS NULL AND key LIKE 'contact_%';
UPDATE cms_settings SET group_name = 'footer'   WHERE group_name IS NULL AND key LIKE 'footer_%';
UPDATE cms_settings SET group_name = 'footer'   WHERE group_name IS NULL AND key LIKE 'church_%';
UPDATE cms_settings SET group_name = 'footer'   WHERE group_name IS NULL AND key IN ('sunday_service_times','midweek_service','prayer_meeting');
UPDATE cms_settings SET group_name = 'social'   WHERE group_name IS NULL AND key LIKE 'social_%';
UPDATE cms_settings SET group_name = 'about'    WHERE group_name IS NULL AND key LIKE 'about_%';
UPDATE cms_settings SET group_name = 'branding' WHERE group_name IS NULL AND key LIKE 'site_%';

-- Seed missing contact settings (DO NOTHING if already exist)
INSERT INTO cms_settings (church_id, key, value, type, group_name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'contact_page_title',      'Contact Us',                                                         'text',    'contact'),
  ('00000000-0000-0000-0000-000000000001', 'contact_page_subtitle',   'We would love to hear from you. Reach out any time.',                'text',    'contact'),
  ('00000000-0000-0000-0000-000000000001', 'contact_address',         '12 Grace Avenue, Accra, Ghana',                                      'text',    'contact'),
  ('00000000-0000-0000-0000-000000000001', 'contact_phone',           '+233 20 000 0001',                                                   'text',    'contact'),
  ('00000000-0000-0000-0000-000000000001', 'contact_email',           'admin@lus4g.org',                                                    'email',   'contact'),
  ('00000000-0000-0000-0000-000000000001', 'contact_office_hours',    'Monday - Friday: 9:00 AM - 5:00 PM',                                 'text',    'contact'),
  ('00000000-0000-0000-0000-000000000001', 'contact_service1_label',  'First Service',                                                      'text',    'contact'),
  ('00000000-0000-0000-0000-000000000001', 'contact_service1_time',   '8:00 AM',                                                            'text',    'contact'),
  ('00000000-0000-0000-0000-000000000001', 'contact_service2_label',  'Second Service',                                                     'text',    'contact'),
  ('00000000-0000-0000-0000-000000000001', 'contact_service2_time',   '10:00 AM',                                                           'text',    'contact'),
  ('00000000-0000-0000-0000-000000000001', 'contact_service3_label',  'Evening Service',                                                    'text',    'contact'),
  ('00000000-0000-0000-0000-000000000001', 'contact_service3_time',   '5:00 PM',                                                            'text',    'contact'),
  ('00000000-0000-0000-0000-000000000001', 'contact_midweek1_label',  'Wednesday Bible Study',                                              'text',    'contact'),
  ('00000000-0000-0000-0000-000000000001', 'contact_midweek1_time',   '6:30 PM',                                                            'text',    'contact'),
  ('00000000-0000-0000-0000-000000000001', 'contact_midweek2_label',  'Friday Prayer Meeting',                                              'text',    'contact'),
  ('00000000-0000-0000-0000-000000000001', 'contact_midweek2_time',   '7:00 PM',                                                            'text',    'contact'),
  ('00000000-0000-0000-0000-000000000001', 'contact_form_enabled',    'true',                                                               'boolean', 'contact'),
  ('00000000-0000-0000-0000-000000000001', 'contact_success_message', 'Thank you for reaching out! We will get back to you within 24 hours.','text',   'contact')
ON CONFLICT (church_id, key) DO NOTHING;

-- Seed missing footer settings (DO NOTHING if already exist)
INSERT INTO cms_settings (church_id, key, value, type, group_name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'footer_church_name',       'LUS4G Church',                                                       'text',  'footer'),
  ('00000000-0000-0000-0000-000000000001', 'footer_tagline',           'One Family. One Faith. One Purpose.',                                'text',  'footer'),
  ('00000000-0000-0000-0000-000000000001', 'footer_address',           '12 Grace Avenue, Accra',                                             'text',  'footer'),
  ('00000000-0000-0000-0000-000000000001', 'footer_city',              'Accra, Ghana',                                                       'text',  'footer'),
  ('00000000-0000-0000-0000-000000000001', 'footer_phone',             '+233 20 000 0001',                                                   'text',  'footer'),
  ('00000000-0000-0000-0000-000000000001', 'footer_email',             'admin@lus4g.org',                                                    'email', 'footer'),
  ('00000000-0000-0000-0000-000000000001', 'footer_sunday_service',    '8AM · 10AM · 5PM',                                                   'text',  'footer'),
  ('00000000-0000-0000-0000-000000000001', 'footer_wednesday_service', 'Wednesday 6:30 PM',                                                  'text',  'footer'),
  ('00000000-0000-0000-0000-000000000001', 'footer_friday_service',    'Friday 7:00 PM',                                                     'text',  'footer'),
  ('00000000-0000-0000-0000-000000000001', 'footer_ministries',        'Choir & Worship|Youth Fellowship|Children''s Church|Outreach|Prayer Ministry|Evangelism', 'text', 'footer'),
  ('00000000-0000-0000-0000-000000000001', 'footer_copyright',         'Built with faith & purpose',                                         'text',  'footer')
ON CONFLICT (church_id, key) DO NOTHING;

-- Seed missing branding settings
INSERT INTO cms_settings (church_id, key, value, type, group_name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'site_logo_url',    '', 'url',  'branding'),
  ('00000000-0000-0000-0000-000000000001', 'site_church_name', 'LUS4G Church', 'text', 'branding')
ON CONFLICT (church_id, key) DO NOTHING;

-- Seed missing social settings
INSERT INTO cms_settings (church_id, key, value, type, group_name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'social_facebook',  '', 'url', 'social'),
  ('00000000-0000-0000-0000-000000000001', 'social_instagram', '', 'url', 'social'),
  ('00000000-0000-0000-0000-000000000001', 'social_twitter',   '', 'url', 'social'),
  ('00000000-0000-0000-0000-000000000001', 'social_youtube',   '', 'url', 'social'),
  ('00000000-0000-0000-0000-000000000001', 'social_tiktok',    '', 'url', 'social'),
  ('00000000-0000-0000-0000-000000000001', 'social_whatsapp',  '', 'url', 'social')
ON CONFLICT (church_id, key) DO NOTHING;
