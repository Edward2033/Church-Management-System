const router = require('express').Router();
const pool = require('../lib/db');
const multer = require('multer');
const { uploadToCloudinary, deleteFromCloudinary } = require('../lib/cloudinary');
const { authenticate } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

const upload = multer({ storage: multer.memoryStorage() });

// GET /api/profile - Get current user's profile
router.get('/', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT u.id, u.email, u.role, u.is_active, u.last_login, u.created_at,
             m.id as member_id, m.member_code, m.first_name, m.middle_name, m.last_name,
             m.gender, m.date_of_birth, m.profile_photo_url, m.phone, m.whatsapp_number,
             m.address, m.city, m.occupation, m.marital_status, m.membership_status,
             m.baptism_status, m.baptism_date, m.date_joined,
             m.emergency_name, m.emergency_phone, m.emergency_relation, m.bio,
             d.id as department_id, d.name as department_name,
             cm.voice_group, cm.choir_role, cm.experience_level, cm.instruments
      FROM users u
      LEFT JOIN members m ON m.user_id = u.id
      LEFT JOIN departments d ON d.id = m.department_id
      LEFT JOIN choir_members cm ON cm.member_id = m.id
      WHERE u.id = $1
    `, [req.user.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    res.json({ profile: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/profile - Update current user's profile
router.put('/', authenticate, upload.single('profilePhoto'), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const {
      firstName, middleName, lastName, gender, dateOfBirth,
      phone, whatsappNumber, address, city, occupation, maritalStatus,
      baptismStatus, baptismDate, emergencyName, emergencyPhone, emergencyRelation, bio
    } = req.body;
    
    // Get current member data
    const { rows: [member] } = await client.query(
      'SELECT id, profile_photo_url FROM members WHERE user_id = $1',
      [req.user.id]
    );
    
    if (!member) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Member profile not found' });
    }
    
    let profilePhotoUrl = member.profile_photo_url;
    
    // Handle profile photo upload
    if (req.file) {
      // Delete old photo if exists
      if (member.profile_photo_url) {
        await deleteFromCloudinary(member.profile_photo_url);
      }
      // Upload new photo
      profilePhotoUrl = await uploadToCloudinary(req.file.buffer, 'profiles');
    }
    
    // Update member record
    const { rows: [updatedMember] } = await client.query(`
      UPDATE members SET
        first_name = COALESCE($1, first_name),
        middle_name = $2,
        last_name = COALESCE($3, last_name),
        gender = COALESCE($4, gender),
        date_of_birth = COALESCE($5, date_of_birth),
        phone = COALESCE($6, phone),
        whatsapp_number = $7,
        address = $8,
        city = $9,
        occupation = $10,
        marital_status = $11,
        baptism_status = COALESCE($12, baptism_status),
        baptism_date = $13,
        emergency_name = $14,
        emergency_phone = $15,
        emergency_relation = $16,
        bio = $17,
        profile_photo_url = $18,
        updated_at = NOW()
      WHERE id = $19
      RETURNING *
    `, [
      firstName, middleName || null, lastName, gender, dateOfBirth || null,
      phone, whatsappNumber || null, address || null, city || null,
      occupation || null, maritalStatus || null,
      baptismStatus !== undefined ? (baptismStatus === 'true' || baptismStatus === true) : null,
      baptismDate || null, emergencyName || null, emergencyPhone || null,
      emergencyRelation || null, bio || null, profilePhotoUrl, member.id
    ]);
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: updatedMember
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// PUT /api/profile/password - Change password
router.put('/password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password required' });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }
    
    // Get current password hash
    const { rows: [user] } = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );
    
    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Hash and update new password
    const newHash = await bcrypt.hash(newPassword, 12);
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newHash, req.user.id]
    );
    
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
