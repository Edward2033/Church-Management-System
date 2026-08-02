-- =============================================================
-- ADD ADMIN MEMBERSHIP STATUS AND PERMISSIONS SYSTEM
-- =============================================================

-- Step 1: Add 'admin' to membership_status constraint
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_membership_status_check;
ALTER TABLE members ADD CONSTRAINT members_membership_status_check 
  CHECK (membership_status IN ('visitor','new_convert','member','choir_member',
                                'leader','pastor','elder','deacon','admin'));

-- Step 2: Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL, -- 'members', 'finance', 'content', 'reports', etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create user_permissions table (for sub-admin granular permissions)
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, permission_id)
);

-- Step 4: Insert default permissions
INSERT INTO permissions (code, name, description, category) VALUES
  -- Members Management
  ('members.view', 'View Members', 'View member list and details', 'members'),
  ('members.create', 'Create Members', 'Add new members to the system', 'members'),
  ('members.edit', 'Edit Members', 'Update member information', 'members'),
  ('members.delete', 'Delete Members', 'Remove members from the system', 'members'),
  ('members.approve', 'Approve Members', 'Approve pending member registrations', 'members'),
  
  -- Finance Management
  ('finance.view', 'View Finance', 'View financial records and reports', 'finance'),
  ('finance.create', 'Create Transactions', 'Add new financial transactions', 'finance'),
  ('finance.edit', 'Edit Transactions', 'Update financial transactions', 'finance'),
  ('finance.delete', 'Delete Transactions', 'Remove financial transactions', 'finance'),
  ('finance.reports', 'Finance Reports', 'Generate and export financial reports', 'finance'),
  
  -- Choir Management
  ('choir.view', 'View Choir', 'View choir members and details', 'choir'),
  ('choir.manage', 'Manage Choir', 'Add/edit/remove choir members', 'choir'),
  ('choir.events', 'Manage Choir Events', 'Create and manage choir events', 'choir'),
  
  -- Content Management
  ('content.announcements', 'Manage Announcements', 'Create/edit/delete announcements', 'content'),
  ('content.events', 'Manage Events', 'Create/edit/delete events', 'content'),
  ('content.gallery', 'Manage Gallery', 'Upload and manage gallery images', 'content'),
  ('content.cms', 'Manage CMS Pages', 'Edit website pages (About, Contact, etc.)', 'content'),
  ('content.hero', 'Manage Hero Slides', 'Update homepage hero slider', 'content'),
  
  -- Reports
  ('reports.view', 'View Reports', 'Access and view system reports', 'reports'),
  ('reports.export', 'Export Reports', 'Export reports to PDF/Excel', 'reports'),
  
  -- Leadership
  ('leadership.manage', 'Manage Leadership', 'Add/edit/remove leadership profiles', 'leadership'),
  
  -- System Settings
  ('settings.view', 'View Settings', 'View system settings', 'settings'),
  ('settings.edit', 'Edit Settings', 'Modify system settings', 'settings'),
  ('settings.users', 'Manage Users', 'Create sub-admins and manage user roles', 'settings')
ON CONFLICT (code) DO NOTHING;

-- Step 5: Create Edward as main admin
DO $$
DECLARE
  edward_user_id UUID;
BEGIN
  -- Insert or update user
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
    is_active = TRUE
  RETURNING id INTO edward_user_id;

  -- If user already exists, get the ID
  IF edward_user_id IS NULL THEN
    SELECT id INTO edward_user_id FROM users WHERE email = 'edwardcole203@gmail.com';
  END IF;

  -- Create or update member record with 'admin' membership status
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
    'ADM-0001',
    'approved',
    'admin',
    'Male',
    '1990-01-01'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    approval_status = 'approved',
    membership_status = 'admin',
    email = 'edwardcole203@gmail.com',
    member_code = 'ADM-0001';

  -- Grant ALL permissions to main admin
  INSERT INTO user_permissions (user_id, permission_id, granted_by)
  SELECT edward_user_id, id, edward_user_id
  FROM permissions
  ON CONFLICT (user_id, permission_id) DO NOTHING;
END $$;

-- Step 6: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission ON user_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);

-- Success message
SELECT 'Admin system created successfully!' AS status
UNION ALL
SELECT ''
UNION ALL
SELECT 'Main Admin Account:'
UNION ALL
SELECT '  Email: edwardcole203@gmail.com'
UNION ALL
SELECT '  Password: Admin@123'
UNION ALL
SELECT '  Role: admin (Full Access)'
UNION ALL
SELECT ''
UNION ALL
SELECT 'Permissions system ready!'
UNION ALL
SELECT '  - 24 granular permissions created'
UNION ALL
SELECT '  - Sub-admin support enabled'
UNION ALL
SELECT '  - Edward has full access to all permissions';
