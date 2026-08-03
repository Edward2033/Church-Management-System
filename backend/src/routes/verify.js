const router = require('express').Router();
const pool = require('../lib/db');

// GET /api/verify/:memberCode - Public member verification by QR code scan
router.get('/:memberCode', async (req, res) => {
  try {
    const { memberCode } = req.params;

    const { rows } = await pool.query(
      `SELECT m.id, m.member_code, m.first_name, m.middle_name, m.last_name, m.gender,
              m.date_of_birth, m.profile_photo_url, m.phone, m.email, m.address, m.city,
              m.occupation, m.marital_status, m.membership_status, m.baptism_status,
              m.date_joined, m.department_id, m.approval_status, m.approved_at, m.created_at,
              u.role, u.last_login,
              d.name AS department_name,
              cm.voice_group, cm.choir_role, cm.experience_level, cm.main_role, cm.is_director
       FROM members m
       LEFT JOIN users u ON u.id = m.user_id
       LEFT JOIN departments d ON d.id = m.department_id
       LEFT JOIN choir_members cm ON cm.member_id = m.id
       WHERE m.member_code = $1 AND m.deleted_at IS NULL`,
      [memberCode]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const member = rows[0];

    // Only return public information
    const publicInfo = {
      member_code: member.member_code,
      full_name: `${member.first_name} ${member.middle_name || ''} ${member.last_name}`.trim(),
      first_name: member.first_name,
      last_name: member.last_name,
      profile_photo_url: member.profile_photo_url,
      role: member.role,
      membership_status: member.membership_status,
      approval_status: member.approval_status,
      date_joined: member.date_joined,
      department_name: member.department_name,
      verified: member.approval_status === 'approved',
      is_choir_member: member.role === 'choir_member',
      voice_group: member.voice_group,
      is_director: member.is_director || false,
    };

    res.json({ member: publicInfo, verified: true });
  } catch (err) {
    console.error('Verification error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
