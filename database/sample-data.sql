-- =============================================================
-- SAMPLE DATA FOR TESTING
-- Run this after schema.sql to populate with test data
-- =============================================================

-- First, ensure default church exists
INSERT INTO churches (id, name, slug, tagline, country, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'LUS4G Church',
  'lus4g',
  'Where Faith Meets Community',
  'Ghana',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline;

-- Create admin user
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Insert admin user
  INSERT INTO users (church_id, email, password_hash, role, is_active, password_set)
  VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin@lus4g.org',
    crypt('Admin@123', gen_salt('bf')),
    'admin',
    TRUE,
    TRUE
  )
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO admin_user_id;

  -- If user already exists, get the ID
  IF admin_user_id IS NULL THEN
    SELECT id INTO admin_user_id FROM users WHERE email = 'admin@lus4g.org';
  END IF;

  -- Create admin member record
  INSERT INTO members (
    user_id, church_id, first_name, last_name, email, phone,
    member_code, approval_status, membership_status, gender, date_of_birth
  )
  VALUES (
    admin_user_id,
    '00000000-0000-0000-0000-000000000001',
    'Admin',
    'User',
    'admin@lus4g.org',
    '+233200000001',
    'ADM-0001',
    'approved',
    'admin',
    'Male',
    '1985-01-15'
  )
  ON CONFLICT (user_id) DO NOTHING;
END $$;

-- Create sample departments
INSERT INTO departments (church_id, name, description, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Choir', 'Church choir and music ministry', TRUE),
  ('00000000-0000-0000-0000-000000000001', 'Youth Ministry', 'Youth programs and activities', TRUE),
  ('00000000-0000-0000-0000-000000000001', 'Women''s Ministry', 'Women''s fellowship and programs', TRUE),
  ('00000000-0000-0000-0000-000000000001', 'Men''s Ministry', 'Men''s fellowship and programs', TRUE),
  ('00000000-0000-0000-0000-000000000001', 'Children''s Ministry', 'Sunday school and children programs', TRUE)
ON CONFLICT DO NOTHING;

-- Create sample members
DO $$
DECLARE
  dept_choir UUID;
  dept_youth UUID;
  user1_id UUID;
  user2_id UUID;
  user3_id UUID;
  member1_id UUID;
  member2_id UUID;
  member3_id UUID;
BEGIN
  -- Get department IDs
  SELECT id INTO dept_choir FROM departments WHERE name = 'Choir' LIMIT 1;
  SELECT id INTO dept_youth FROM departments WHERE name = 'Youth Ministry' LIMIT 1;

  -- Create user 1
  INSERT INTO users (church_id, email, password_hash, role, is_active, password_set)
  VALUES (
    '00000000-0000-0000-0000-000000000001',
    'john.mensah@lus4g.org',
    crypt('Member@123', gen_salt('bf')),
    'member',
    TRUE,
    TRUE
  )
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO user1_id;
  
  IF user1_id IS NULL THEN
    SELECT id INTO user1_id FROM users WHERE email = 'john.mensah@lus4g.org';
  END IF;

  -- Create member 1
  INSERT INTO members (
    user_id, church_id, first_name, last_name, email, phone, whatsapp_number,
    member_code, approval_status, membership_status, gender, date_of_birth,
    address, city, occupation, marital_status, baptism_status, department_id
  )
  VALUES (
    user1_id,
    '00000000-0000-0000-0000-000000000001',
    'John',
    'Mensah',
    'john.mensah@lus4g.org',
    '+233244123456',
    '+233244123456',
    'MBR-0001',
    'approved',
    'member',
    'Male',
    '1990-05-15',
    '12 Grace Street, Accra',
    'Accra',
    'Software Engineer',
    'Single',
    TRUE,
    dept_choir
  )
  ON CONFLICT (user_id) DO NOTHING
  RETURNING id INTO member1_id;

  -- Create user 2 (choir member)
  INSERT INTO users (church_id, email, password_hash, role, is_active, password_set)
  VALUES (
    '00000000-0000-0000-0000-000000000001',
    'grace.asante@lus4g.org',
    crypt('Member@123', gen_salt('bf')),
    'choir_member',
    TRUE,
    TRUE
  )
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO user2_id;
  
  IF user2_id IS NULL THEN
    SELECT id INTO user2_id FROM users WHERE email = 'grace.asante@lus4g.org';
  END IF;

  -- Create member 2
  INSERT INTO members (
    user_id, church_id, first_name, last_name, email, phone, whatsapp_number,
    member_code, approval_status, membership_status, gender, date_of_birth,
    address, city, occupation, marital_status, baptism_status, department_id
  )
  VALUES (
    user2_id,
    '00000000-0000-0000-0000-000000000001',
    'Grace',
    'Asante',
    'grace.asante@lus4g.org',
    '+233244234567',
    '+233244234567',
    'CHR-0001',
    'approved',
    'choir_member',
    'Female',
    '1992-08-20',
    '45 Hope Avenue, Accra',
    'Accra',
    'Teacher',
    'Married',
    TRUE,
    dept_choir
  )
  ON CONFLICT (user_id) DO NOTHING
  RETURNING id INTO member2_id;

  -- Add to choir
  IF member2_id IS NOT NULL THEN
    INSERT INTO choir_members (
      member_id, church_id, choir_role, voice_group, experience_level,
      instruments, main_role, approval_status
    )
    VALUES (
      member2_id,
      '00000000-0000-0000-0000-000000000001',
      'choir_member',
      'Soprano',
      'Advanced',
      ARRAY['Piano'],
      'Lead Singer',
      'approved'
    )
    ON CONFLICT (member_id) DO NOTHING;
  END IF;

  -- Create user 3 (youth)
  INSERT INTO users (church_id, email, password_hash, role, is_active, password_set)
  VALUES (
    '00000000-0000-0000-0000-000000000001',
    'samuel.boateng@lus4g.org',
    crypt('Member@123', gen_salt('bf')),
    'member',
    TRUE,
    TRUE
  )
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO user3_id;
  
  IF user3_id IS NULL THEN
    SELECT id INTO user3_id FROM users WHERE email = 'samuel.boateng@lus4g.org';
  END IF;

  -- Create member 3
  INSERT INTO members (
    user_id, church_id, first_name, last_name, email, phone,
    member_code, approval_status, membership_status, gender, date_of_birth,
    address, city, occupation, marital_status, baptism_status, department_id
  )
  VALUES (
    user3_id,
    '00000000-0000-0000-0000-000000000001',
    'Samuel',
    'Boateng',
    'samuel.boateng@lus4g.org',
    '+233244345678',
    'MBR-0002',
    'approved',
    'member',
    'Male',
    '2000-03-10',
    '78 Faith Road, Kumasi',
    'Kumasi',
    'Student',
    'Single',
    TRUE,
    dept_youth
  )
  ON CONFLICT (user_id) DO NOTHING;
END $$;

-- Create sample finance categories
INSERT INTO finance_categories (church_id, name, type, description, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Tithes', 'income', 'Tithes and offerings', TRUE),
  ('00000000-0000-0000-0000-000000000001', 'Donations', 'income', 'General donations', TRUE),
  ('00000000-0000-0000-0000-000000000001', 'Event Income', 'income', 'Income from church events', TRUE),
  ('00000000-0000-0000-0000-000000000001', 'Choir Dues', 'income', 'Choir membership dues', TRUE),
  ('00000000-0000-0000-0000-000000000001', 'Utilities', 'expense', 'Electricity, water, internet', TRUE),
  ('00000000-0000-0000-0000-000000000001', 'Maintenance', 'expense', 'Building and equipment maintenance', TRUE),
  ('00000000-0000-0000-0000-000000000001', 'Salaries', 'expense', 'Staff salaries', TRUE),
  ('00000000-0000-0000-0000-000000000001', 'Outreach', 'expense', 'Community outreach programs', TRUE)
ON CONFLICT DO NOTHING;

-- Create sample events
INSERT INTO events (
  church_id, title, description, category, event_date, start_time, end_time,
  location, audience, is_active, requires_registration
)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Sunday Worship Service',
    'Join us for a powerful worship experience',
    'service',
    CURRENT_DATE + INTERVAL '7 days',
    '08:00:00',
    '12:00:00',
    'Main Sanctuary',
    'all',
    TRUE,
    FALSE
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Choir Rehearsal',
    'Weekly choir practice for all voice groups',
    'rehearsal',
    CURRENT_DATE + INTERVAL '3 days',
    '18:00:00',
    '20:00:00',
    'Choir Hall',
    'choir',
    TRUE,
    FALSE
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Youth Night',
    'Fun-filled evening for young people',
    'youth',
    CURRENT_DATE + INTERVAL '5 days',
    '17:00:00',
    '20:00:00',
    'Youth Center',
    'youth',
    TRUE,
    TRUE
  )
ON CONFLICT DO NOTHING;

-- Create sample announcements
INSERT INTO announcements (
  church_id, title, content, category, is_active, pinned, audience
)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Welcome to LUS4G Church!',
    'We are excited to have you join our church family. May God bless you abundantly.',
    'church',
    TRUE,
    TRUE,
    'all'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Choir Registration Open',
    'Interested in joining the choir? Registration is now open for new members. Contact the choir director for more information.',
    'choir',
    TRUE,
    FALSE,
    'all'
  )
ON CONFLICT DO NOTHING;

-- Create sample leadership
INSERT INTO leadership (
  church_id, name, title, bio, sort_order, is_active
)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Pastor John Mensah',
    'Senior Pastor',
    'Leading the church with passion and vision for over 15 years.',
    1,
    TRUE
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Elder Samuel Asante',
    'Head of Choir',
    'Music director and choir leader, bringing souls closer to God through worship.',
    2,
    TRUE
  )
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Sample data created successfully! You can now login with:' AS status
UNION ALL
SELECT '  Email: admin@lus4g.org'
UNION ALL
SELECT '  Password: Admin@123'
UNION ALL
SELECT ''
UNION ALL
SELECT 'Other test accounts:'
UNION ALL
SELECT '  john.mensah@lus4g.org / Member@123'
UNION ALL
SELECT '  grace.asante@lus4g.org / Member@123 (Choir Member)'
UNION ALL
SELECT '  samuel.boateng@lus4g.org / Member@123';
