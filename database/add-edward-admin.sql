-- Create admin account for Edward Cole
-- Email: edwardcole203@gmail.com
-- Password: Admin@123 (change after first login)

DO $$
DECLARE
  edward_user_id UUID;
BEGIN
  -- Insert user
  INSERT INTO users (church_id, email, password_hash, role, is_active, password_set)
  VALUES (
    '00000000-0000-0000-0000-000000000001',
    'edwardcole203@gmail.com',
    crypt('Admin@123', gen_salt('bf')),
    'admin',
    TRUE,
    TRUE
  )
  ON CONFLICT (email) DO UPDATE SET
    role = 'admin',
    is_active = TRUE,
    password_set = TRUE
  RETURNING id INTO edward_user_id;

  -- If user already exists, get the ID
  IF edward_user_id IS NULL THEN
    SELECT id INTO edward_user_id FROM users WHERE email = 'edwardcole203@gmail.com';
  END IF;

  -- Create or update member record
  INSERT INTO members (
    user_id, church_id, first_name, last_name, email, phone,
    member_code, approval_status, membership_status, gender, date_of_birth
  )
  VALUES (
    edward_user_id,
    '00000000-0000-0000-0000-000000000001',
    'Edward',
    'Cole',
    'edwardcole203@gmail.com',
    '+233200000000',
    'ADM-0002',
    'approved',
    'admin',
    'Male',
    '1990-01-01'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    approval_status = 'approved',
    membership_status = 'admin',
    email = 'edwardcole203@gmail.com';
END $$;

SELECT 'Admin account created successfully!' AS status
UNION ALL
SELECT '  Email: edwardcole203@gmail.com'
UNION ALL
SELECT '  Password: Admin@123'
UNION ALL
SELECT '  (Please change password after first login)';
