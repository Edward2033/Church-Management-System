const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool    = require('../lib/db');
const { sendEmail, approvalEmail, passwordResetEmail } = require('../lib/email');
const { authenticate, requireAdmin } = require('../middleware/auth');

const signAccess  = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });

const signRefresh = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const multer = require('multer');
  const { uploadToCloudinary } = require('../lib/cloudinary');
  const upload = multer({ storage: multer.memoryStorage() });
  
  // Use multer middleware inline
  upload.single('profilePhoto')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: 'File upload error' });
    
    const client = await pool.connect();
    try {
      const {
        first_name, middle_name, last_name, gender, date_of_birth,
        email, phone, whatsapp_number, address, city, occupation, marital_status,
        baptism_status, baptized,
        emergency_name, emergency_contact_name,
        emergency_phone, emergency_contact_phone,
        emergency_relation, bio,
        membership_type = 'member',
        church_id = process.env.DEFAULT_CHURCH_ID,
      } = req.body;

      // REQUIRED FIELDS VALIDATION
      if (!first_name || !last_name || !email) {
        return res.status(400).json({ error: 'First name, last name and email are required' });
      }
      if (!phone) {
        return res.status(400).json({ error: 'Phone number is required' });
      }
      if (!gender) {
        return res.status(400).json({ error: 'Gender is required' });
      }
      if (!date_of_birth) {
        return res.status(400).json({ error: 'Date of birth is required' });
      }
      
      // AGE VALIDATION: Must be at least 12 years old
      const birthDate = new Date(date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const dayDiff = today.getDate() - birthDate.getDate();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
      
      if (actualAge < 12) {
        return res.status(400).json({ error: 'You must be at least 12 years old to register' });
      }
      
      if (!address) {
        return res.status(400).json({ error: 'Address is required' });
      }
      if (!req.file) {
        return res.status(400).json({ error: 'Profile photo is required' });
      }
      
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      const resolvedBaptism = baptism_status !== undefined 
        ? (baptism_status === true || baptism_status === 'true') 
        : (baptized === 'yes' || baptized === true);
      const resolvedEmergName = emergency_name || emergency_contact_name || null;
      const resolvedEmergPhone = emergency_phone || emergency_contact_phone || null;

      const resolvedVoiceGroup = req.body.voice_group || req.body.voice_type || null;
      if (membership_type === 'choir' && !resolvedVoiceGroup) {
        return res.status(400).json({ error: 'Voice group is required for choir members' });
      }

      // Map main_role to actual system role
      let userRole = 'member'; // default
      const mainRole = req.body.main_role?.toLowerCase() || '';
      
      if (membership_type === 'choir') {
        if (mainRole.includes('director')) {
          userRole = 'choir_director';
        } else if (mainRole.includes('worship leader') || mainRole.includes('leader')) {
          userRole = 'leader';
        } else {
          userRole = 'choir_member';
        }
      }
      
      // If user explicitly selected a role that maps to pastor/elder, use it
      if (mainRole.includes('pastor')) userRole = 'pastor';
      if (mainRole.includes('elder')) userRole = 'elder';

      const exists = await client.query('SELECT id FROM users WHERE email = $1', [email]);
      if (exists.rows[0]) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      await client.query('BEGIN');

      // Upload profile photo to Cloudinary
      const profilePhotoUrl = await uploadToCloudinary(req.file.buffer, 'profiles');

      // Use the mapped userRole (not hardcoded)
      const { rows: [user] } = await client.query(
        `INSERT INTO users (church_id, email, role) VALUES ($1,$2,$3) RETURNING id, role`,
        [church_id, email, userRole]
      );

      const { rows: [member] } = await client.query(
        `INSERT INTO members
          (user_id, church_id, first_name, middle_name, last_name, gender, date_of_birth,
           phone, whatsapp_number, email, address, city, occupation, marital_status,
           baptism_status, emergency_name, emergency_phone, emergency_relation, bio,
           membership_status, approval_status, profile_photo_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,'pending',$21)
         RETURNING id, first_name, last_name, email, membership_status, approval_status, profile_photo_url`,
        [user.id, church_id, first_name, middle_name || null, last_name, gender,
         date_of_birth, phone, whatsapp_number, email, address, city,
         occupation, marital_status, resolvedBaptism,
         resolvedEmergName, resolvedEmergPhone, emergency_relation, bio,
         userRole === 'choir_director' ? 'choir_director' : userRole === 'leader' ? 'leader' : membership_type === 'choir' ? 'choir_member' : 'visitor', 
         profilePhotoUrl]
      );

      // If choir registration, create choir_members record
      if (membership_type === 'choir' && resolvedVoiceGroup) {
        const choirRole = userRole === 'choir_director' ? 'choir_director' : 'choir_member';
        await client.query(
          `INSERT INTO choir_members (member_id, church_id, voice_group, choir_role, main_role)
           VALUES ($1,$2,$3,$4,$5)`,
          [member.id, church_id, resolvedVoiceGroup, choirRole, req.body.main_role || 'Choir Member']
        );
      }

      await client.query('COMMIT');
      res.status(201).json({
        message: 'Registration submitted successfully! Awaiting admin approval.',
        member: { 
          id: member.id, 
          email: member.email, 
          approval_status: member.approval_status,
          profile_photo_url: member.profile_photo_url
        },
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Register error:', err.message);
      res.status(500).json({ error: err.message });
    } finally { 
      client.release(); 
    }
  });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const { rows } = await pool.query(
      `SELECT u.*, m.id AS member_id, m.member_code, m.first_name, m.last_name,
              m.profile_photo_url, m.approval_status, m.membership_status,
              m.church_id AS member_church_id
       FROM users u LEFT JOIN members m ON m.user_id = u.id
       WHERE u.email = $1`,
      [email]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!user.is_active) return res.status(403).json({ error: 'Account disabled' });
    if (!user.password_set || !user.password_hash)
      return res.status(403).json({ error: 'Password not set. Check your email for the setup link.' });
    if (user.approval_status === 'pending')
      return res.status(403).json({ error: 'Account pending admin approval' });
    if (user.approval_status === 'rejected')
      return res.status(403).json({ error: 'Account rejected. Contact admin.' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const accessToken  = signAccess(user.id, user.role);
    const refreshToken = signRefresh(user.id);
    const refreshExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await pool.query(
      `UPDATE users SET last_login=NOW(), refresh_token=$1, refresh_expires=$2 WHERE id=$3`,
      [refreshToken, refreshExpires, user.id]
    );

    const { password_hash, refresh_token, ...safe } = user;
    res.json({ accessToken, refreshToken, user: safe });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const { rows } = await pool.query(
      `SELECT * FROM users WHERE id=$1 AND refresh_token=$2 AND refresh_expires>NOW() AND is_active=TRUE`,
      [decoded.id, refreshToken]
    );
    if (!rows[0]) return res.status(401).json({ error: 'Refresh token expired or revoked' });

    const newAccess  = signAccess(rows[0].id, rows[0].role);
    const newRefresh = signRefresh(rows[0].id);
    const expires    = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
      `UPDATE users SET refresh_token=$1, refresh_expires=$2 WHERE id=$3`,
      [newRefresh, expires, rows[0].id]
    );
    res.json({ accessToken: newAccess, refreshToken: newRefresh });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req, res) => {
  await pool.query('UPDATE users SET refresh_token=NULL, refresh_expires=NULL WHERE id=$1', [req.user.id]);
  res.json({ message: 'Logged out' });
});

// GET /api/auth/me — returns full member profile
router.get('/me', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         u.id, u.email, u.role, u.is_active, u.password_set, u.last_login, u.created_at,
         u.church_id,
         m.id              AS member_id,
         m.member_code,
         m.first_name,     m.middle_name,    m.last_name,
         m.gender,         m.date_of_birth,
         m.profile_photo_url,
         m.phone,          m.whatsapp_number,
         m.email           AS member_email,
         m.address,        m.city,
         m.occupation,     m.marital_status,
         m.membership_status,
         m.baptism_status, m.baptism_date,
         m.date_joined,
         m.emergency_name, m.emergency_phone, m.emergency_relation,
         m.bio,
         m.approval_status, m.approved_at,
         m.church_id       AS member_church_id,
         d.id              AS department_id,
         d.name            AS department_name,
         cm.id             AS choir_member_id,
         cm.voice_group,   cm.choir_role,
         cm.experience_level, cm.instruments, cm.choir_activities,
         cm.is_active      AS choir_active,
         cm.main_role,
         cm.is_director    AS is_choir_director
       FROM users u
       LEFT JOIN members m       ON m.user_id      = u.id
       LEFT JOIN departments d   ON d.id           = m.department_id
       LEFT JOIN choir_members cm ON cm.member_id  = m.id AND cm.is_active = TRUE
       WHERE u.id = $1 AND u.is_active = TRUE`,
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    const { password_hash, refresh_token, ...safe } = rows[0];
    // Normalise email: prefer member email, fall back to user email
    safe.email = safe.member_email || safe.email;
    res.json({ user: safe });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/setup-password
router.post('/setup-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password || password.length < 8)
      return res.status(400).json({ error: 'Token and password (min 8 chars) required' });

    const { rows } = await pool.query(
      `SELECT * FROM auth_tokens WHERE token=$1 AND type='account_setup' AND used=FALSE AND expires_at>NOW()`,
      [token]
    );
    if (!rows[0]) return res.status(400).json({ error: 'Invalid or expired link' });

    const hash = await bcrypt.hash(password, 12);
    await pool.query(`UPDATE users SET password_hash=$1, password_set=TRUE WHERE id=$2`, [hash, rows[0].user_id]);
    await pool.query(`UPDATE auth_tokens SET used=TRUE WHERE id=$1`, [rows[0].id]);
    res.json({ message: 'Password set. You can now log in.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/auth/validate-token - Validate account setup token
router.get('/validate-token', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Token required' });

    const { rows } = await pool.query(
      `SELECT at.*, u.email 
       FROM auth_tokens at 
       JOIN users u ON u.id = at.user_id
       WHERE at.token=$1 AND at.type='account_setup' AND at.used=FALSE AND at.expires_at>NOW()`,
      [token]
    );
    
    if (!rows[0]) {
      return res.json({ valid: false, error: 'Invalid or expired token' });
    }
    
    res.json({ valid: true, email: rows[0].email });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (!rows[0]) return res.json({ message: 'If that email exists, a reset link was sent.' });

    const tok = uuidv4();
    await pool.query(
      `INSERT INTO auth_tokens (user_id,token,type,expires_at) VALUES ($1,$2,'password_reset',NOW()+INTERVAL '1 hour')`,
      [rows[0].id, tok]
    );
    const link = `${process.env.FRONTEND_URL}/reset-password?token=${tok}`;
    await sendEmail(passwordResetEmail(rows[0], link));
    res.json({ message: 'If that email exists, a reset link was sent.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password || password.length < 8)
      return res.status(400).json({ error: 'Token and password (min 8 chars) required' });

    const { rows } = await pool.query(
      `SELECT * FROM auth_tokens WHERE token=$1 AND type='password_reset' AND used=FALSE AND expires_at>NOW()`,
      [token]
    );
    if (!rows[0]) return res.status(400).json({ error: 'Invalid or expired reset link' });

    const hash = await bcrypt.hash(password, 12);
    await pool.query(`UPDATE users SET password_hash=$1 WHERE id=$2`, [hash, rows[0].user_id]);
    await pool.query(`UPDATE auth_tokens SET used=TRUE WHERE id=$1`, [rows[0].id]);
    res.json({ message: 'Password reset successfully.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/auth/approve/:memberId  — Step 1: approve only (no email yet)
router.post('/approve/:memberId', authenticate, requireAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    const { memberId } = req.params;
    const { rows: [m] } = await client.query(
      `SELECT m.*, u.id AS user_id, u.role AS user_role, u.password_set
       FROM members m JOIN users u ON u.id=m.user_id WHERE m.id=$1`,
      [memberId]
    );
    if (!m) return res.status(404).json({ error: 'Member not found' });
    if (m.approval_status === 'approved') return res.status(400).json({ error: 'Already approved' });

    const { rows: [codeRow] } = await client.query(
      `SELECT generate_member_code($1,$2) AS code`, [m.church_id, m.user_role || 'member']
    );

    await client.query('BEGIN');
    await client.query(
      `UPDATE members SET approval_status='approved', member_code=$1,
       membership_status=CASE WHEN membership_status='visitor' THEN 'member' ELSE membership_status END,
       approved_at=NOW(), approved_by=$2 WHERE id=$3`,
      [codeRow.code, req.user.id, memberId]
    );
    await client.query('COMMIT');

    res.json({ message: 'Member approved', member_code: codeRow.code });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Approve error:', err.message);
    res.status(500).json({ error: err.message });
  } finally { client.release(); }
});

// POST /api/auth/grant-account/:memberId  — Step 2: send setup email
router.post('/grant-account/:memberId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { memberId } = req.params;
    
    // Use pool.query directly instead of pool.connect()
    const { rows: [m] } = await pool.query(
      `SELECT m.*, u.id AS user_id, u.email AS user_email, u.role AS user_role, u.password_set
       FROM members m JOIN users u ON u.id=m.user_id WHERE m.id=$1`,
      [memberId]
    );
    
    if (!m) return res.status(404).json({ error: 'Member not found' });
    if (m.approval_status !== 'approved') return res.status(400).json({ error: 'Member must be approved first' });
    if (m.password_set) return res.status(400).json({ error: 'Account already active — password already set' });

    // Invalidate any existing unused setup tokens
    await pool.query(
      `UPDATE auth_tokens SET used=TRUE WHERE user_id=$1 AND type='account_setup' AND used=FALSE`,
      [m.user_id]
    );
    
    // Create new token
    const tok = uuidv4();
    await pool.query(
      `INSERT INTO auth_tokens (user_id,token,type,expires_at) VALUES ($1,$2,'account_setup',NOW()+INTERVAL '48 hours')`,
      [m.user_id, tok]
    );

    const link = `${process.env.FRONTEND_URL}/setup-password?token=${tok}`;
    await sendEmail(approvalEmail({ 
      ...m, 
      email: m.user_email || m.email, 
      member_code: m.member_code,
      role: m.user_role // Use the actual user role from users table
    }, link));
    
    res.json({ message: 'Account setup email sent successfully' });
  } catch (err) {
    console.error('Grant account error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/reject/:memberId
router.post('/reject/:memberId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    await pool.query(
      `UPDATE members SET approval_status='rejected', rejected_reason=$1 WHERE id=$2`,
      [reason || null, req.params.memberId]
    );
    res.json({ message: 'Member rejected' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/auth/change-role/:memberId - Admin can change user role
router.patch('/change-role/:memberId', authenticate, requireAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    const { memberId } = req.params;
    const { role } = req.body;
    
    // Validate role - must match database constraint (updated to include choir_director)
    const validRoles = ['member', 'choir_member', 'choir_director', 'leader', 'pastor', 'elder', 'deacon', 'admin', 'superadmin', 'visitor'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be one of: ' + validRoles.join(', ') });
    }
    
    // Get member and user info
    const { rows: [member] } = await client.query(
      `SELECT m.*, u.id AS user_id FROM members m JOIN users u ON u.id=m.user_id WHERE m.id=$1`,
      [memberId]
    );
    
    if (!member) return res.status(404).json({ error: 'Member not found' });
    
    await client.query('BEGIN');
    
    // Update user role
    await client.query(`UPDATE users SET role=$1 WHERE id=$2`, [role, member.user_id]);
    
    // Update membership_status to match role
    let membershipStatus = role;
    if (role === 'superadmin') membershipStatus = 'admin'; // superadmin → admin in members table
    if (role === 'visitor') membershipStatus = 'visitor';
    
    await client.query(
      `UPDATE members SET membership_status=$1 WHERE id=$2`,
      [membershipStatus, memberId]
    );
    
    // If choir roles (choir_member or choir_director), update choir_members table
    if (role === 'choir_member' || role === 'choir_director') {
      // Check if choir_members record exists
      const { rows: [choirRecord] } = await client.query(
        `SELECT id FROM choir_members WHERE member_id=$1`,
        [memberId]
      );
      
      const choirRole = role === 'choir_director' ? 'director' : 'choir_member';
      const isDirector = role === 'choir_director';
      
      if (choirRecord) {
        // Update existing record
        await client.query(
          `UPDATE choir_members SET choir_role=$1, is_director=$2, is_active=TRUE WHERE member_id=$3`,
          [choirRole, isDirector, memberId]
        );
      } else {
        // Create new choir_members record
        await client.query(
          `INSERT INTO choir_members (member_id, church_id, choir_role, is_director, voice_group) 
           VALUES ($1, $2, $3, $4, 'Soprano')`,
          [memberId, member.church_id, choirRole, isDirector]
        );
      }
    }
    
    await client.query('COMMIT');
    
    res.json({ 
      message: 'Role updated successfully', 
      newRole: role 
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Change role error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// PUT /api/auth/update-email - User can update their own email
router.put('/update-email', authenticate, async (req, res) => {
  const client = await pool.connect();
  try {
    const { newEmail, password } = req.body;

    if (!newEmail || !password) {
      return res.status(400).json({ error: 'New email and password are required' });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Verify password
    const { rows: [user] } = await client.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (!user || !user.password_hash) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Check if email already exists
    const { rows: existing } = await client.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [newEmail, req.user.id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    await client.query('BEGIN');

    // Update users.email
    await client.query('UPDATE users SET email = $1 WHERE id = $2', [newEmail, req.user.id]);

    // Update members.email
    await client.query('UPDATE members SET email = $1 WHERE user_id = $2', [newEmail, req.user.id]);

    await client.query('COMMIT');
    res.json({ message: 'Email updated successfully', email: newEmail });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Update email error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});


module.exports = router;
