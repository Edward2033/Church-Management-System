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

    const resolvedBaptism    = baptism_status !== undefined ? (baptism_status === true || baptism_status === 'true') : (baptized === 'yes' || baptized === true);
    const resolvedEmergName  = emergency_name  || emergency_contact_name  || null;
    const resolvedEmergPhone = emergency_phone || emergency_contact_phone || null;

    if (!first_name || !last_name || !email)
      return res.status(400).json({ error: 'first_name, last_name and email are required' });
    if (!phone)
      return res.status(400).json({ error: 'phone is required' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ error: 'Invalid email format' });

    const resolvedVoiceGroup = req.body.voice_group || req.body.voice_type || null;
    if (membership_type === 'choir' && !resolvedVoiceGroup)
      return res.status(400).json({ error: 'voice_group is required for choir members' });

    const exists = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows[0]) return res.status(409).json({ error: 'Email already registered' });

    await client.query('BEGIN');

    const userRole = membership_type === 'choir' ? 'choir_member' : 'member';
    const { rows: [user] } = await client.query(
      `INSERT INTO users (church_id, email, role) VALUES ($1,$2,$3) RETURNING id, role`,
      [church_id, email, userRole]
    );

    const { rows: [member] } = await client.query(
      `INSERT INTO members
        (user_id, church_id, first_name, middle_name, last_name, gender, date_of_birth,
         phone, whatsapp_number, email, address, city, occupation, marital_status,
         baptism_status, emergency_name, emergency_phone, emergency_relation, bio,
         membership_status, approval_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,'pending')
       RETURNING id, first_name, last_name, email, membership_status, approval_status`,
      [user.id, church_id, first_name, middle_name || null, last_name, gender,
       date_of_birth || null, phone, whatsapp_number, email, address, city,
       occupation, marital_status, resolvedBaptism,
       resolvedEmergName, resolvedEmergPhone, emergency_relation, bio,
       membership_type === 'choir' ? 'choir_member' : 'visitor']
    );

    // If choir registration, also create choir_members record
    if (membership_type === 'choir' && resolvedVoiceGroup) {
      await client.query(
        `INSERT INTO choir_members (member_id, church_id, voice_group, choir_role)
         VALUES ($1,$2,$3,'choir_member')`,
        [member.id, church_id, resolvedVoiceGroup]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({
      message: 'Registration submitted. Awaiting admin approval.',
      member: { id: member.id, email: member.email, approval_status: member.approval_status },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Register error:', err.message);
    res.status(500).json({ error: err.message });
  } finally { client.release(); }
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

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  const { password_hash, refresh_token, ...safe } = req.user;
  res.json({ user: safe });
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

// POST /api/auth/approve/:memberId
router.post('/approve/:memberId', authenticate, requireAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    const { memberId } = req.params;
    const { rows: [m] } = await client.query(
      `SELECT m.*, u.email AS user_email, u.role AS user_role
       FROM members m JOIN users u ON u.id=m.user_id WHERE m.id=$1`,
      [memberId]
    );
    if (!m) return res.status(404).json({ error: 'Member not found' });

    const { rows: [codeRow] } = await client.query(
      `SELECT generate_member_code($1,$2) AS code`, [m.church_id, m.user_role || 'member']
    );

    await client.query('BEGIN');
    await client.query(
      `UPDATE members SET approval_status='approved', member_code=$1, approved_at=NOW(), approved_by=$2 WHERE id=$3`,
      [codeRow.code, req.user.id, memberId]
    );

    const tok = uuidv4();
    await client.query(
      `INSERT INTO auth_tokens (user_id,token,type,expires_at) VALUES ($1,$2,'account_setup',NOW()+INTERVAL '24 hours')`,
      [m.user_id, tok]
    );
    await client.query('COMMIT');

    const link = `${process.env.FRONTEND_URL}/setup-password?token=${tok}`;
    await sendEmail(approvalEmail({ ...m, member_code: codeRow.code }, link));
    res.json({ message: 'Approved and email sent', member_code: codeRow.code });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Approve error:', err.message);
    res.status(500).json({ error: err.message });
  } finally { client.release(); }
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

module.exports = router;
