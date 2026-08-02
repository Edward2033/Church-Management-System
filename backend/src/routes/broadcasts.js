/**
 * /api/broadcasts — Choir broadcast messaging (from LUS4G system)
 * Sends messages to all choir members via email, SMS, and WhatsApp
 */
const router = require('express').Router();
const pool   = require('../lib/db');
const { authenticate, requireAdmin, requireSameChurch } = require('../middleware/auth');
const { notifyBroadcast } = require('../services/notification');

// GET /api/broadcasts — list all broadcasts
router.get('/', authenticate, requireAdmin, requireSameChurch, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT b.*, u.email AS sender_email,
              m.first_name || ' ' || m.last_name AS sender_name
       FROM choir_broadcasts b
       LEFT JOIN users u ON u.id = b.created_by
       LEFT JOIN members m ON m.user_id = b.created_by
       WHERE b.church_id = $1
       ORDER BY b.created_at DESC`,
      [req.churchId]
    );
    res.json({ broadcasts: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/broadcasts — send a broadcast to all active choir members
router.post('/', authenticate, requireAdmin, requireSameChurch, async (req, res) => {
  try {
    const { message, audience = 'choir' } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'message required' });

    // Save broadcast record
    const { rows: [broadcast] } = await pool.query(
      `INSERT INTO choir_broadcasts (church_id, message, audience, created_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.churchId, message, audience, req.user.id]
    );

    // Fetch recipients based on audience
    let memberQuery = `
      SELECT m.id, m.first_name, m.last_name, m.email, m.phone, m.whatsapp_number
      FROM members m
      LEFT JOIN choir_members cm ON cm.member_id = m.id
      WHERE m.church_id = $1 AND m.approval_status = 'approved' AND m.deleted_at IS NULL`;

    if (audience === 'choir') {
      memberQuery += ` AND cm.id IS NOT NULL AND cm.approval_status = 'approved'`;
    }

    const { rows: members } = await pool.query(memberQuery, [req.churchId]);

    // Send notifications asynchronously
    members.forEach((member) => {
      notifyBroadcast(
        { ...member, name: `${member.first_name} ${member.last_name}`, whatsapp: member.whatsapp_number },
        message
      ).catch((err) => console.error('[Broadcast notify error]', err.message));
    });

    res.status(201).json({
      broadcast,
      recipients_count: members.length,
      message: `Broadcast sent to ${members.length} member(s)`,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/broadcasts/:id
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM choir_broadcasts WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
