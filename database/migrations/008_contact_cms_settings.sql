-- ═══════════════════════════════════════════════════════════════
-- Migration: 008 - Contact CMS Settings
-- Description: Add default contact page settings to cms_settings
-- Date: 2026-08-05
-- ═══════════════════════════════════════════════════════════════

-- Seed default Contact settings
INSERT INTO cms_settings (church_id, key, value, type, group_name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'contact_page_title',           'Contact Us',                                                  'text',    'contact'),
  ('00000000-0000-0000-0000-000000000001', 'contact_page_subtitle',        'We would love to hear from you. Reach out any time.',         'text',    'contact'),
  ('00000000-0000-0000-0000-000000000001', 'contact_address',              '12 Grace Avenue, Accra, Ghana',                               'text',    'contact'),
  ('00000000-0000-0000-0000-000000000001', 'contact_phone',                '+233 20 000 0001',                                            'text',    'contact'),
  ('00000000-0000-0000-0000-000000000001', 'contact_email',                'admin@lus4g.org',                                             'email',   'contact'),
  ('00000000-0000-0000-0000-000000000001', 'contact_office_hours',         'Monday - Friday: 9:00 AM - 5:00 PM',                          'text',    'contact'),
  ('00000000-0000-0000-0000-000000000001', 'contact_service1_label',       'First Service',                                               'text',    'contact'),
  ('00000000-0000-0000-0000-000000000001', 'contact_service1_time',        '8:00 AM',                                                     'text',    'contact'),
  ('00000000-0000-0000-0000-000000000001', 'contact_service2_label',       'Second Service',                                              'text',    'contact'),
  ('00000000-0000-0000-0000-000000000001', 'contact_service2_time',        '10:00 AM',                                                    'text',    'contact'),
  ('00000000-0000-0000-0000-000000000001', 'contact_service3_label',       'Evening Service',                                             'text',    'contact'),
  ('00000000-0000-0000-0000-000000000001', 'contact_service3_time',        '5:00 PM',                                                     'text',    'contact'),
  ('00000000-0000-0000-0000-000000000001', 'contact_midweek1_label',       'Wednesday Bible Study',                                        'text',    'contact'),
  ('00000000-0000-0000-0000-000000000001', 'contact_midweek1_time',        '6:30 PM',                                                     'text',    'contact'),
  ('00000000-0000-0000-0000-000000000001', 'contact_midweek2_label',       'Friday Prayer Meeting',                                        'text',    'contact'),
  ('00000000-0000-0000-0000-000000000001', 'contact_midweek2_time',        '7:00 PM',                                                     'text',    'contact'),
  ('00000000-0000-0000-0000-000000000001', 'contact_form_enabled',         'true',                                                        'boolean', 'contact'),
  ('00000000-0000-0000-0000-000000000001', 'contact_success_message',      'Thank you for reaching out! We will get back to you within 24 hours.', 'text', 'contact')
ON CONFLICT (church_id, key) DO NOTHING;

-- Add Contact tab configuration to admin CMS if needed
COMMENT ON TABLE cms_settings IS 'Stores all CMS configuration including contact page settings';

