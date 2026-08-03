const router = require('express').Router();
const pool   = require('../lib/db');
const multer = require('multer');
const crypto = require('crypto');
const { uploadToCloudinary } = require('../lib/cloudinary');
const { sendEmail } = require('../lib/email');
const { FRONTEND_URL } = require('../config');
const { authenticate, requireAdmin, requireSelfOrAdmin, requireSameChurch } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });

const MEMBER_SELECT = `
  SELECT m.id, m.member_code, m.first_name, m.middle_name, m.last_name, m.gender,
    m.date_of_birth, m.profile_photo_url, m.phone, m.whatsapp_number, m.email,
    m.address, m.city, m.occupation, m.marital_status, m.membership_status,
    m.baptism_status, m.baptism_date, m.date_joined, m.department_id,
    m.emergency_name, m.emergency_phone, m.emergency_relation, m.bio,
    m.approval_status, m.approved_at, m.created_at,
    u.role, u.id AS user_id, u.last_login,
    d.name AS department_name,
    cm.voice_group, cm.choir_role, cm.experience_level, cm.instruments,
    cm.choir_activities, cm.is_active AS choir_active, cm.main_role
  FROM members m
  LEFT JOIN users u ON u.id = m.user_id
  LEFT JOIN departments d ON d.id = m.department_id
  LEFT JOIN choir_members cm ON cm.member_id = m.id`;

// GET /api/members
router.get('/', authenticate, requireSameChurch, async (req, res) => {
  try {
    const churchId = req.churchId || process.env.DEFAULT_CHURCH_ID;
    const isAdmin  = ['admin','superadmin','pastor','elder'].includes(req.user.role);
    const { approval_status: qs_approval, status: qs_status, role, search, page = 1, limit = 50 } = req.query;
    const approval_status = qs_approval || qs_status;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let q     = `${MEMBER_SELECT} WHERE m.church_id = $1 AND m.deleted_at IS NULL`;
    const params = [churchId];
    let idx   = 2;

    if (!isAdmin) { q += ` AND m.approval_status = 'approved'`; }
    else if (approval_status) { q += ` AND m.approval_status = $${idx++}`; params.push(approval_status); }

    if (role) { q += ` AND u.role = $${idx++}`; params.push(role); }

    if (search) {
      q += ` AND (m.first_name ILIKE $${idx} OR m.last_name ILIKE $${idx}
             OR m.email ILIKE $${idx} OR m.member_code ILIKE $${idx}
             OR m.phone ILIKE $${idx})`;
      params.push(`%${search}%`); idx++;
    }

    const countQ  = q.replace(MEMBER_SELECT, 'SELECT COUNT(*) AS total');
    const [data, countRes] = await Promise.all([
      pool.query(q + ` ORDER BY m.created_at DESC LIMIT $${idx} OFFSET $${idx+1}`,
        [...params, parseInt(limit), offset]),
      pool.query(countQ, params),
    ]);

    res.json({
      members: data.rows,
      total:   parseInt(countRes.rows[0]?.total || 0),
      page:    parseInt(page),
      limit:   parseInt(limit),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/members/stats
router.get('/stats', authenticate, requireAdmin, requireSameChurch, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE m.approval_status='approved')                                         AS total_members,
        COUNT(*) FILTER (WHERE m.approval_status='approved' AND u.role='choir_member')               AS choir_members,
        COUNT(*) FILTER (WHERE m.approval_status='pending')                                          AS pending,
        COUNT(*) FILTER (WHERE m.approval_status='approved'
          AND EXTRACT(MONTH FROM m.date_of_birth)=EXTRACT(MONTH FROM CURRENT_DATE)
          AND EXTRACT(DAY   FROM m.date_of_birth)=EXTRACT(DAY   FROM CURRENT_DATE))                  AS birthdays_today,
        COUNT(DISTINCT m.department_id) FILTER (WHERE m.department_id IS NOT NULL)                  AS departments_active
      FROM members m LEFT JOIN users u ON u.id=m.user_id
      WHERE m.church_id=$1 AND m.deleted_at IS NULL`,
      [req.churchId]
    );
    const s = rows[0];
    res.json({
      totalMembers:      parseInt(s.total_members),
      choirMembers:      parseInt(s.choir_members),
      pending:           parseInt(s.pending),
      birthdaysToday:    parseInt(s.birthdays_today),
      departmentsActive: parseInt(s.departments_active),
      total:  parseInt(s.total_members),
      choir:  parseInt(s.choir_members),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/members/birthdays
router.get('/birthdays', async (req, res) => {
  try {
    const churchId = req.query.church_id || process.env.DEFAULT_CHURCH_ID;
    const { rows } = await pool.query(`
      SELECT m.id, m.first_name, m.last_name, m.member_code, m.profile_photo_url,
             m.date_of_birth, u.role
      FROM members m LEFT JOIN users u ON u.id=m.user_id
      WHERE m.church_id=$1 AND m.approval_status='approved' AND m.deleted_at IS NULL
        AND EXTRACT(MONTH FROM m.date_of_birth)=EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(DAY   FROM m.date_of_birth)=EXTRACT(DAY   FROM CURRENT_DATE)
      ORDER BY m.first_name`,
      [churchId]
    );
    res.json({ birthdays: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/members/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `${MEMBER_SELECT} WHERE m.id=$1 AND m.deleted_at IS NULL`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Member not found' });
    res.json({ member: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/members/:id
router.patch('/:id', authenticate, requireSelfOrAdmin, async (req, res) => {
  try {
    if (req.body.voice_type      !== undefined && req.body.voice_group      === undefined) req.body.voice_group      = req.body.voice_type;
    if (req.body.baptized        !== undefined && req.body.baptism_status   === undefined) req.body.baptism_status   = req.body.baptized === true || req.body.baptized === 'yes';
    if (req.body.emergency_contact_name  !== undefined && req.body.emergency_name  === undefined) req.body.emergency_name  = req.body.emergency_contact_name;
    if (req.body.emergency_contact_phone !== undefined && req.body.emergency_phone === undefined) req.body.emergency_phone = req.body.emergency_contact_phone;

    const allowed = ['first_name','middle_name','last_name','gender','date_of_birth',
      'profile_photo_url','phone','whatsapp_number','address','city','occupation',
      'marital_status','baptism_status','baptism_date','department_id',
      'emergency_name','emergency_phone','emergency_relation','bio'];
    const updates = []; const vals = []; let i = 1;
    allowed.forEach((f) => {
      if (req.body[f] !== undefined) { updates.push(`${f}=$${i++}`); vals.push(req.body[f]); }
    });
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });

    if (['admin','superadmin'].includes(req.user.role) && req.body.membership_status) {
      updates.push(`membership_status=$${i++}`); vals.push(req.body.membership_status);
    }

    vals.push(req.user.id);
    vals.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE members SET ${updates.join(',')}, updated_by=$${i++}, updated_at=NOW()
       WHERE id=$${i} RETURNING id, member_code, first_name, last_name, email, profile_photo_url`,
      vals
    );
    res.json({ member: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/members/:id (soft delete)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await pool.query(
      `UPDATE members SET deleted_at=NOW(), updated_by=$1 WHERE id=$2`,
      [req.user.id, req.params.id]
    );
    await pool.query(`UPDATE users SET is_active=FALSE WHERE id=(SELECT user_id FROM members WHERE id=$1)`, [req.params.id]);
    res.json({ message: 'Member deactivated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/members/create - Admin manually creates a user
router.post('/create', authenticate, requireAdmin, upload.single('profilePhoto'), async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      first_name, middle_name, last_name, gender, date_of_birth,
      email, phone, whatsapp_number, address, city, occupation, marital_status,
      baptism_status, emergency_name, emergency_phone, emergency_relation, bio,
      role = 'member', // member, choir_member, or admin
      voice_group, // Required if role is choir_member
      is_director, // Boolean - if this choir member is the choir director
      church_id = process.env.DEFAULT_CHURCH_ID,
    } = req.body;

    // Validation
    if (!first_name || !last_name || !email || !phone || !gender || !date_of_birth || !address) {
      return res.status(400).json({ error: 'Required fields: first_name, last_name, email, phone, gender, date_of_birth, address' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (role === 'choir_member' && !voice_group) {
      return res.status(400).json({ error: 'Voice group is required for choir members' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Profile photo is required' });
    }

    // Check if email already exists
    const exists = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows[0]) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    await client.query('BEGIN');

    // Upload profile photo to Cloudinary
    const profilePhotoUrl = await uploadToCloudinary(req.file.buffer, 'profiles');

    // Create user account
    const { rows: [user] } = await client.query(
      `INSERT INTO users (church_id, email, role) VALUES ($1, $2, $3) RETURNING id, role`,
      [church_id, email, role]
    );

    // Generate member code
    const { rows: [codeRow] } = await client.query(
      `SELECT generate_member_code($1, $2) AS code`, [church_id, role]
    );

    // Determine membership_status based on role
    let membership_status = 'member';
    if (role === 'choir_member') membership_status = 'choir_member';
    else if (role === 'admin') membership_status = 'admin';
    else if (role === 'pastor') membership_status = 'pastor';
    else if (role === 'elder') membership_status = 'elder';
    else if (role === 'deacon') membership_status = 'deacon';
    else if (role === 'leader') membership_status = 'leader';

    // Create member record
    const { rows: [member] } = await client.query(
      `INSERT INTO members
        (user_id, church_id, first_name, middle_name, last_name, gender, date_of_birth,
         phone, whatsapp_number, email, address, city, occupation, marital_status,
         baptism_status, emergency_name, emergency_phone, emergency_relation, bio,
         membership_status, approval_status, member_code, profile_photo_url, approved_at, approved_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, 'approved', $21, $22, NOW(), $23)
       RETURNING id, first_name, last_name, email, member_code, profile_photo_url`,
      [user.id, church_id, first_name, middle_name || null, last_name, gender, date_of_birth,
       phone, whatsapp_number || null, email, address, city || null, occupation || null,
       marital_status || null, baptism_status === 'true' || baptism_status === true,
       emergency_name || null, emergency_phone || null, emergency_relation || null, bio || null,
       membership_status, codeRow.code, profilePhotoUrl, req.user.id]
    );

    // If choir member, create choir_members record
    if (role === 'choir_member' && voice_group) {
      const choirRole = (is_director === 'true' || is_director === true) ? 'choir_director' : 'choir_member';
      await client.query(
        `INSERT INTO choir_members (member_id, church_id, voice_group, choir_role, is_director, approval_status, approved_at, approved_by)
         VALUES ($1, $2, $3, $4, $5, 'approved', NOW(), $6)`,
        [member.id, church_id, voice_group, choirRole, is_director === 'true' || is_director === true, req.user.id]
      );
    }

    // Create account setup token (7 days expiry)
    const token = crypto.randomBytes(32).toString('hex');
    await client.query(
      `INSERT INTO auth_tokens (user_id, token, type, expires_at) VALUES ($1, $2, 'account_setup', NOW() + INTERVAL '7 days')`,
      [user.id, token]
    );

    await client.query('COMMIT');

    // Send welcome email with password setup link
    const setupLink = `${FRONTEND_URL}/setup-password?token=${token}`;
    await sendEmail({
      to: email,
      subject: 'Welcome to LUS4G Church - Account Created',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7c3aed;">Welcome to LUS4G Church!</h2>
          <p>Hello <strong>${first_name} ${last_name}</strong>,</p>
          <p>Your church account has been created by an administrator.</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Member Code:</strong> ${member.member_code}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 5px 0;"><strong>Role:</strong> ${role}</p>
          </div>
          <p>To activate your account, please set your password by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${setupLink}" style="background-color: #7c3aed; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">Set Password</a>
          </div>
          <p style="color: #666; font-size: 14px;">This link will expire in 7 days. If you did not request this account, please contact the church administrator.</p>
          <p style="color: #666; font-size: 14px;">Or copy this link: <a href="${setupLink}">${setupLink}</a></p>
        </div>
      `
    });

    res.status(201).json({
      message: 'User created successfully. Password setup email sent.',
      member: {
        id: member.id,
        member_code: member.member_code,
        email: member.email,
        profile_photo_url: member.profile_photo_url,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create member error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
