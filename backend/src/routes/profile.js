const router = require('express').Router();
const pool = require('../lib/db');
const multer = require('multer');
const { uploadToCloudinary, deleteImage } = require('../lib/cloudinary');
const { authenticate } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

const upload = multer({ storage: multer.memoryStorage() });

// GET /api/profile - Get current user's profile
router.get('/', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT u.id, u.email AS user_email, u.role, u.is_active, u.last_login, u.created_at,
             m.id as member_id, m.member_code, m.first_name, m.middle_name, m.last_name,
             m.gender, m.date_of_birth, m.profile_photo_url, m.phone, m.whatsapp_number,
             m.email AS member_email,
             m.address, m.city, m.occupation, m.marital_status, m.membership_status,
             m.baptism_status, m.baptism_date, m.date_joined,
             m.emergency_name, m.emergency_phone, m.emergency_relation, m.bio,
             m.approval_status, m.approved_at,
             d.id as department_id, d.name as department_name,
             cm.voice_group, cm.choir_role, cm.experience_level, cm.instruments,
             cm.choir_activities, cm.main_role, cm.is_director AS is_choir_director
      FROM users u
      LEFT JOIN members m ON m.user_id = u.id
      LEFT JOIN departments d ON d.id = m.department_id
      LEFT JOIN choir_members cm ON cm.member_id = m.id AND cm.is_active = TRUE
      WHERE u.id = $1
    `, [req.user.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const profile = rows[0];
    // Normalise email: prefer member email over user email
    profile.email = profile.member_email || profile.user_email;
    
    res.json({ profile });
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
    
    // Validate age if date of birth is provided
    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const dayDiff = today.getDate() - birthDate.getDate();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
      
      if (actualAge < 12) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Members must be at least 12 years old' });
      }
    }
    
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
      // Delete old photo if exists (extract public_id from URL if needed)
      if (member.profile_photo_url) {
        // Extract public_id from Cloudinary URL if it's a Cloudinary URL
        try {
          const urlParts = member.profile_photo_url.split('/');
          const publicIdWithExt = urlParts.slice(-2).join('/'); // folder/filename.ext
          const publicId = publicIdWithExt.replace(/\.[^/.]+$/, ''); // remove extension
          await deleteImage(publicId);
        } catch (err) {
          console.log('Could not delete old photo:', err.message);
        }
      }
      // Upload new photo
      profilePhotoUrl = await uploadToCloudinary(req.file.buffer, 'profiles');
    }
    
    // Update member record — convert empty strings to null so COALESCE keeps existing values
    const toVal = (v) => (v === undefined || v === null || v === '') ? null : v;
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
      toVal(firstName), toVal(middleName), toVal(lastName), toVal(gender),
      toVal(dateOfBirth),
      toVal(phone), toVal(whatsappNumber), toVal(address), toVal(city),
      toVal(occupation), toVal(maritalStatus),
      baptismStatus !== undefined && baptismStatus !== '' ? (baptismStatus === 'true' || baptismStatus === true) : null,
      toVal(baptismDate), toVal(emergencyName), toVal(emergencyPhone),
      toVal(emergencyRelation), toVal(bio), profilePhotoUrl, member.id
    ]);
    
    await client.query('COMMIT');

    // Re-fetch full profile with all JOINs so the response matches /auth/me
    const { rows: [fullProfile] } = await pool.query(`
      SELECT u.id, u.email AS user_email, u.role, u.is_active, u.last_login, u.created_at,
             m.id as member_id, m.member_code, m.first_name, m.middle_name, m.last_name,
             m.gender, m.date_of_birth, m.profile_photo_url, m.phone, m.whatsapp_number,
             m.email AS member_email,
             m.address, m.city, m.occupation, m.marital_status, m.membership_status,
             m.baptism_status, m.baptism_date, m.date_joined,
             m.emergency_name, m.emergency_phone, m.emergency_relation, m.bio,
             m.approval_status, m.approved_at,
             d.id as department_id, d.name as department_name,
             cm.voice_group, cm.choir_role, cm.experience_level, cm.instruments,
             cm.choir_activities, cm.main_role, cm.is_director AS is_choir_director
      FROM users u
      LEFT JOIN members m ON m.user_id = u.id
      LEFT JOIN departments d ON d.id = m.department_id
      LEFT JOIN choir_members cm ON cm.member_id = m.id AND cm.is_active = TRUE
      WHERE u.id = $1
    `, [req.user.id]);

    if (fullProfile) {
      fullProfile.email = fullProfile.member_email || fullProfile.user_email;
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: fullProfile || updatedMember
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

// PUT /api/profile/email - Update email address
router.put('/email', authenticate, async (req, res) => {
  const client = await pool.connect();
  try {
    const { newEmail, password } = req.body;
    
    if (!newEmail || !password) {
      return res.status(400).json({ error: 'New email and current password are required' });
    }
    
    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    await client.query('BEGIN');
    
    // Verify current password
    const { rows: [user] } = await client.query(
      `SELECT password_hash FROM users WHERE id=$1`,
      [req.user.id]
    );
    
    if (!user || !user.password_hash) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Password not set' });
    }
    
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      await client.query('ROLLBACK');
      return res.status(401).json({ error: 'Incorrect password' });
    }
    
    // Check if new email is already taken
    const { rows: existingUsers } = await client.query(
      `SELECT id FROM users WHERE email=$1 AND id != $2`,
      [newEmail, req.user.id]
    );
    
    if (existingUsers.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Email already in use' });
    }
    
    // Update email in users table
    await client.query(
      `UPDATE users SET email=$1 WHERE id=$2`,
      [newEmail, req.user.id]
    );
    
    // Update email in members table
    await client.query(
      `UPDATE members SET email=$1 WHERE user_id=$2`,
      [newEmail, req.user.id]
    );
    
    await client.query('COMMIT');
    
    res.json({ message: 'Email updated successfully', newEmail });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Email update error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
