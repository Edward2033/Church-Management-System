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
    const churchId = req.churchId || process.env.DEFAULT_CHURCH_ID;
    
    let query = `
      SELECT id, name, email, phone, subject, message, 
             is_read, is_replied, replied_at, created_at
      FROM contact_messages
      WHERE church_id = $1
    `;
    const params = [churchId];
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
    const churchId = req.churchId || process.env.DEFAULT_CHURCH_ID;
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
    `, [churchId]);
    
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

// PATCH /api/contact/:id/reply - Send email reply to visitor
router.patch('/:id/reply', authenticate, requireAdmin, async (req, res) => {
  const { sendEmail } = require('../lib/email');
  
  try {
    const { replyMessage } = req.body;
    
    if (!replyMessage || !replyMessage.trim()) {
      return res.status(400).json({ error: 'Reply message is required' });
    }
    
    // Get the contact message
    const { rows } = await pool.query(`
      SELECT cm.*, m.first_name as admin_first_name, m.last_name as admin_last_name
      FROM contact_messages cm
      CROSS JOIN members m
      WHERE cm.id = $1 AND cm.church_id = $2 
        AND m.user_id = $3
    `, [req.params.id, req.churchId, req.user.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    const message = rows[0];
    const adminName = `${message.admin_first_name} ${message.admin_last_name}`;
    
    // Get church info for email template
    const { rows: churchRows } = await pool.query(`
      SELECT value FROM cms_settings 
      WHERE church_id = $1 AND key IN ('footer_church_name', 'footer_email', 'footer_phone')
    `, [req.churchId]);
    
    const churchSettings = {};
    churchRows.forEach(row => {
      const key = row.key.replace('footer_', '');
      churchSettings[key] = row.value;
    });
    
    const churchName = churchSettings.church_name || 'LUS4G Church';
    const churchEmail = churchSettings.email || process.env.SMTP_USER;
    const churchPhone = churchSettings.phone || '';
    
    // Send email reply
    await sendEmail({
      to: message.email,
      subject: `Re: ${message.subject || 'Your inquiry'}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .message-box { background: white; border-left: 4px solid #7c3aed; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            .button { display: inline-block; background: #7c3aed; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${churchName}</h1>
              <p>Thank you for reaching out to us</p>
            </div>
            <div class="content">
              <p>Dear ${message.name},</p>
              <p>Thank you for contacting us. We received your message and ${adminName} has responded:</p>
              
              <div class="message-box">
                <strong>Your Message:</strong>
                <p>${message.message}</p>
              </div>
              
              <div class="message-box">
                <strong>Our Response:</strong>
                <p>${replyMessage}</p>
              </div>
              
              <p>If you have any further questions, please don't hesitate to contact us.</p>
              
              <p>Blessings,<br>${adminName}<br>${churchName}</p>
            </div>
            <div class="footer">
              <p><strong>${churchName}</strong></p>
              ${churchEmail ? `<p>Email: ${churchEmail}</p>` : ''}
              ${churchPhone ? `<p>Phone: ${churchPhone}</p>` : ''}
              <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
                This email was sent in response to your inquiry. Please do not reply directly to this email.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    });
    
    // Mark as replied
    const { rows: [updated] } = await pool.query(`
      UPDATE contact_messages
      SET is_replied = true, is_read = true, replied_by = $1, replied_at = NOW(), reply_message = $2
      WHERE id = $3 AND church_id = $4
      RETURNING *
    `, [req.user.id, replyMessage, req.params.id, req.churchId]);
    
    res.json({ success: true, message: 'Reply sent successfully', contact: updated });
  } catch (err) {
    console.error('Reply email error:', err);
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
