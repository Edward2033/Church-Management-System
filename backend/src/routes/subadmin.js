const router = require('express').Router();
const pool = require('../lib/db');
const crypto = require('crypto');
const { sendEmail } = require('../lib/email');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { FRONTEND_URL } = require('../config');

// GET /api/subadmin - List all sub-admins
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const churchId = req.churchId || process.env.DEFAULT_CHURCH_ID;
    const { rows } = await pool.query(`
      SELECT u.id, u.email, u.role, u.is_active, u.last_login, u.created_at,
             m.first_name, m.last_name, m.phone, m.profile_photo_url,
             m.member_code, m.membership_status,
             COUNT(up.id) as permission_count
      FROM users u
      LEFT JOIN members m ON m.user_id = u.id
      LEFT JOIN user_permissions up ON up.user_id = u.id
      WHERE u.church_id = $1 
        AND u.role IN ('admin', 'pastor', 'elder', 'deacon', 'leader')
        AND u.id != $2
      GROUP BY u.id, m.id
      ORDER BY u.created_at DESC
    `, [churchId, req.user.id]);
    
    res.json({ subAdmins: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/subadmin - Create sub-admin with permissions
router.post('/', authenticate, requireAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const {
      email,
      firstName,
      lastName,
      phone,
      role = 'leader', // leader, deacon, elder, pastor, admin
      gender = 'Male',
      dateOfBirth,
      permissions = [] // Array of permission IDs
    } = req.body;
    
    if (!email || !firstName || !lastName) {
      return res.status(400).json({ error: 'Email, first name, and last name required' });
    }
    
    // Check if email already exists
    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    // Create user with temporary password
    const tempPassword = crypto.randomBytes(16).toString('hex');
    const { rows: [user] } = await client.query(`
      INSERT INTO users (church_id, email, password_hash, role, is_active, password_set)
      VALUES ($1, $2, crypt($3, gen_salt('bf')), $4, true, false)
      RETURNING id, email
    `, [req.churchId, email, tempPassword, role]);
    
    // Generate member code
    const { rows: [{ code }] } = await client.query(
      'SELECT generate_member_code($1, $2) as code',
      [req.churchId, role]
    );
    
    // Create member record
    await client.query(`
      INSERT INTO members (
        user_id, church_id, first_name, last_name, email, phone,
        member_code, approval_status, membership_status, gender, date_of_birth
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'approved', $8, $9, $10)
    `, [
      user.id, req.churchId, firstName, lastName, email, phone || null,
      code, role, gender, dateOfBirth || null
    ]);
    
    // Grant permissions if provided
    if (permissions.length > 0) {
      const values = permissions.map((permId, idx) => 
        `($1, $${idx + 2}, $${permissions.length + 2})`
      ).join(', ');
      
      await client.query(
        `INSERT INTO user_permissions (user_id, permission_id, granted_by)
         VALUES ${values}`,
        [user.id, ...permissions, req.user.id]
      );
    }
    
    // Create account setup token
    const token = crypto.randomBytes(32).toString('hex');
    await client.query(`
      INSERT INTO auth_tokens (user_id, token, type, expires_at)
      VALUES ($1, $2, 'account_setup', NOW() + INTERVAL '7 days')
    `, [user.id, token]);
    
    await client.query('COMMIT');
    
    // Send setup email
    const setupLink = `${FRONTEND_URL}/setup-password?token=${token}`;
    await sendEmail({
      to: email,
      subject: 'Account Created - Set Your Password',
      html: `
        <h2>Welcome to LUS4G Church Management System</h2>
        <p>Hello ${firstName},</p>
        <p>An administrator account has been created for you with the role: <strong>${role}</strong>.</p>
        <p>Please click the link below to set your password and access your dashboard:</p>
        <p><a href="${setupLink}" style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Set Your Password</a></p>
        <p>This link will expire in 7 days.</p>
        <p>Your login email: <strong>${email}</strong></p>
        <br>
        <p>Best regards,<br>LUS4G Church Team</p>
      `
    });
    
    res.json({
      success: true,
      message: 'Sub-admin created successfully',
      user: { id: user.id, email: user.email, role }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// PUT /api/subadmin/:id - Update sub-admin
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, role, isActive, permissions } = req.body;
    
    // Update member info
    await pool.query(`
      UPDATE members SET
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        phone = COALESCE($3, phone),
        membership_status = COALESCE($4, membership_status),
        updated_at = NOW()
      WHERE user_id = $5
    `, [firstName, lastName, phone, role, id]);
    
    // Update user
    if (typeof isActive !== 'undefined' || role) {
      await pool.query(`
        UPDATE users SET
          is_active = COALESCE($1, is_active),
          role = COALESCE($2, role),
          updated_at = NOW()
        WHERE id = $3 AND church_id = $4
      `, [isActive, role, id, req.churchId]);
    }
    
    // Update permissions if provided
    if (Array.isArray(permissions)) {
      await pool.query('DELETE FROM user_permissions WHERE user_id = $1', [id]);
      
      if (permissions.length > 0) {
        const values = permissions.map((permId, idx) => 
          `($1, $${idx + 2}, $${permissions.length + 2})`
        ).join(', ');
        
        await pool.query(
          `INSERT INTO user_permissions (user_id, permission_id, granted_by)
           VALUES ${values}`,
          [id, ...permissions, req.user.id]
        );
      }
    }
    
    res.json({ success: true, message: 'Sub-admin updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/subadmin/:id - Deactivate sub-admin
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query(`
      UPDATE users SET is_active = false, updated_at = NOW()
      WHERE id = $1 AND church_id = $2
    `, [id, req.churchId]);
    
    res.json({ success: true, message: 'Sub-admin deactivated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
