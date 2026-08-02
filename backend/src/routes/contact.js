const router = require('express').Router();
const pool = require('../lib/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

// POST /api/contact - Public contact form submission
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message, churchId } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }
    
    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    const church_id = churchId || process.env.DEFAULT_CHURCH_ID;
    
    const { rows: [contact] } = await pool.query(`
      INSERT INTO contact_messages (church_id, name, email, phone, subject, message)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, email, created_at
    `, [church_id, name, email, phone || null, subject || null, message]);
    
    res.json({
      success: true,
      message: 'Thank you for contacting us! We will get back to you soon.',
      contact
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/contact - Get all contact messages (admin only)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let query = `
      SELECT id, name, email, phone, subject, message, 
             is_read, is_replied, replied_at, created_at
      FROM contact_messages
      WHERE church_id = $1
    `;
    const params = [req.churchId];
    let paramIndex = 2;
    
    // Filter by status
    if (status === 'unread') {
      query += ` AND is_read = false`;
    } else if (status === 'read') {
      query += ` AND is_read = true`;
    } else if (status === 'replied') {
      query += ` AND is_replied = true`;
    } else if (status === 'pending') {
      query += ` AND is_replied = false`;
    }
    
    // Search
    if (search) {
      query += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR subject ILIKE $${paramIndex} OR message ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    // Get total count
    const countQuery = query.replace(
      'SELECT id, name, email, phone, subject, message, is_read, is_replied, replied_at, created_at',
      'SELECT COUNT(*) as total'
    );
    const { rows: [{ total }] } = await pool.query(countQuery, params);
    
    // Get paginated results
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);
    
    const { rows } = await pool.query(query, params);
    
    res.json({
      messages: rows,
      total: parseInt(total),
      page: parseInt(page),
      limit: parseInt(limit),
      unread: rows.filter(m => !m.is_read).length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/contact/stats - Get contact message statistics
router.get('/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const { rows: [stats] } = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_read = false) as unread,
        COUNT(*) FILTER (WHERE is_replied = false) as pending,
        COUNT(*) FILTER (WHERE is_replied = true) as replied,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as this_week,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as this_month
      FROM contact_messages
      WHERE church_id = $1
    `, [req.churchId]);
    
    res.json({
      total: parseInt(stats.total),
      unread: parseInt(stats.unread),
      pending: parseInt(stats.pending),
      replied: parseInt(stats.replied),
      thisWeek: parseInt(stats.this_week),
      thisMonth: parseInt(stats.this_month)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/contact/:id - Get single contact message
router.get('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT cm.*, u.email as replied_by_email, u.id as replied_by_id,
             m.first_name as replied_by_first_name, m.last_name as replied_by_last_name
      FROM contact_messages cm
      LEFT JOIN users u ON u.id = cm.replied_by
      LEFT JOIN members m ON m.user_id = u.id
      WHERE cm.id = $1 AND cm.church_id = $2
    `, [req.params.id, req.churchId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    res.json({ message: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/contact/:id/read - Mark as read
router.patch('/:id/read', authenticate, requireAdmin, async (req, res) => {
  try {
    const { rows: [message] } = await pool.query(`
      UPDATE contact_messages
      SET is_read = true
      WHERE id = $1 AND church_id = $2
      RETURNING *
    `, [req.params.id, req.churchId]);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    res.json({ success: true, message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/contact/:id/reply - Mark as replied
router.patch('/:id/reply', authenticate, requireAdmin, async (req, res) => {
  try {
    const { rows: [message] } = await pool.query(`
      UPDATE contact_messages
      SET is_replied = true, is_read = true, replied_by = $1, replied_at = NOW()
      WHERE id = $2 AND church_id = $3
      RETURNING *
    `, [req.user.id, req.params.id, req.churchId]);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    res.json({ success: true, message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/contact/:id - Delete contact message
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM contact_messages WHERE id = $1 AND church_id = $2 RETURNING id',
      [req.params.id, req.churchId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    res.json({ success: true, message: 'Contact message deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/contact/bulk/read - Mark multiple as read
router.patch('/bulk/read', authenticate, requireAdmin, async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array required' });
    }
    
    await pool.query(`
      UPDATE contact_messages
      SET is_read = true
      WHERE id = ANY($1) AND church_id = $2
    `, [ids, req.churchId]);
    
    res.json({ success: true, message: `${ids.length} messages marked as read` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/contact/bulk/delete - Delete multiple messages
router.delete('/bulk/delete', authenticate, requireAdmin, async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array required' });
    }
    
    const { rowCount } = await pool.query(
      'DELETE FROM contact_messages WHERE id = ANY($1) AND church_id = $2',
      [ids, req.churchId]
    );
    
    res.json({ success: true, message: `${rowCount} messages deleted` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
