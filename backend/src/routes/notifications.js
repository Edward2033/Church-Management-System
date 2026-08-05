const router = require('express').Router();
const pool = require('../lib/db');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { sendEmail } = require('../lib/email');

// ══════════════════════════════════════════════════════════════
// MEMBER ENDPOINTS - Get notifications for current user
// ══════════════════════════════════════════════════════════════

// GET /api/notifications - Get user's notifications
router.get('/', authenticate, async (req, res) => {
  try {
    const { limit = 50, offset = 0, unread_only = 'false' } = req.query;
    
    let query = `
      SELECT 
        n.*,
        nd.delivered_at,
        nd.read_at,
        u.first_name as sender_first_name,
        u.last_name as sender_last_name
      FROM notifications n
      INNER JOIN notification_delivery nd ON n.id = nd.notification_id
      LEFT JOIN users u ON n.sender_id = u.id
      WHERE nd.user_id = $1
        AND n.church_id = $2
        AND n.status = 'published'
        AND (n.expiry_date IS NULL OR n.expiry_date > NOW())
    `;
    
    const params = [req.user.id, req.churchId];
    
    if (unread_only === 'true') {
      query += ` AND nd.read_at IS NULL`;
    }
    
    query += ` ORDER BY n.publish_date DESC, n.created_at DESC LIMIT $3 OFFSET $4`;
    params.push(parseInt(limit), parseInt(offset));
    
    const { rows } = await pool.query(query, params);
    
    // Get unread count
    const { rows: [unreadCount] } = await pool.query(
      `SELECT COUNT(*) as count 
       FROM notification_delivery 
       WHERE user_id = $1 AND read_at IS NULL`,
      [req.user.id]
    );
    
    res.json({
      notifications: rows,
      unread_count: parseInt(unreadCount.count)
    });
  } catch (err) {
    console.error('[GET /notifications]', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const { rows: [delivery] } = await pool.query(
      `UPDATE notification_delivery 
       SET read_at = NOW()
       WHERE notification_id = $1 AND user_id = $2 AND read_at IS NULL
       RETURNING *`,
      [req.params.id, req.user.id]
    );
    
    if (!delivery) {
      return res.status(404).json({ error: 'Notification not found or already read' });
    }
    
    res.json({ message: 'Notification marked as read', delivery });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/notifications/read-all - Mark all as read
router.put('/read-all', authenticate, async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      `UPDATE notification_delivery 
       SET read_at = NOW()
       WHERE user_id = $1 AND read_at IS NULL`,
      [req.user.id]
    );
    
    res.json({ message: `Marked ${rowCount} notifications as read` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// ADMIN ENDPOINTS - Manage notifications
// ══════════════════════════════════════════════════════════════

// GET /api/notifications/admin/all - Get all notifications (admin)
router.get('/admin/all', authenticate, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let query = `
      SELECT 
        n.*,
        u.first_name as sender_first_name,
        u.last_name as sender_last_name,
        COUNT(nd.id) as delivery_count
      FROM notifications n
      LEFT JOIN users u ON n.sender_id = u.id
      LEFT JOIN notification_delivery nd ON n.id = nd.notification_id
      WHERE n.church_id = $1
    `;
    
    const params = [req.churchId];
    
    if (status) {
      query += ` AND n.status = $${params.length + 1}`;
      params.push(status);
    }
    
    query += ` GROUP BY n.id, u.first_name, u.last_name
               ORDER BY n.created_at DESC 
               LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);
    
    const { rows } = await pool.query(query, params);
    
    const { rows: [count] } = await pool.query(
      `SELECT COUNT(*) as total FROM notifications WHERE church_id = $1`,
      [req.churchId]
    );
    
    res.json({
      notifications: rows,
      total: parseInt(count.total),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    console.error('[GET /notifications/admin/all]', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/notifications/admin/:id - Get notification details (admin)
router.get('/admin/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { rows: [notification] } = await pool.query(
      `SELECT n.*, 
              COUNT(nd.id) as delivered_count,
              COUNT(CASE WHEN nd.read_at IS NOT NULL THEN 1 END) as read_count
       FROM notifications n
       LEFT JOIN notification_delivery nd ON n.id = nd.notification_id
       WHERE n.id = $1 AND n.church_id = $2
       GROUP BY n.id`,
      [req.params.id, req.churchId]
    );
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    // Get delivery details
    const { rows: deliveries } = await pool.query(
      `SELECT 
        nd.*,
        u.first_name,
        u.last_name,
        u.email,
        u.role
       FROM notification_delivery nd
       JOIN users u ON nd.user_id = u.id
       WHERE nd.notification_id = $1
       ORDER BY nd.delivered_at DESC
       LIMIT 100`,
      [req.params.id]
    );
    
    res.json({ notification, deliveries });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notifications/admin - Create notification (admin)
router.post('/admin', authenticate, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      message,
      type = 'announcement',
      audience = 'all',
      priority = 'normal',
      image_url,
      attachment_url,
      publish_date,
      expiry_date,
      status = 'draft'
    } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }
    
    const { rows: [notification] } = await pool.query(
      `INSERT INTO notifications 
        (church_id, title, message, type, audience, priority, image_url, 
         attachment_url, publish_date, expiry_date, status, sender_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        req.churchId, title, message, type, audience, priority,
        image_url || null, attachment_url || null,
        publish_date || new Date().toISOString(),
        expiry_date || null, status, req.user.id
      ]
    );
    
    // If publishing immediately, deliver to users
    if (status === 'published') {
      await deliverNotification(notification);
    }
    
    res.status(201).json({ notification });
  } catch (err) {
    console.error('[POST /notifications/admin]', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/notifications/admin/:id - Update notification (admin)
router.put('/admin/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const {
      title, message, type, audience, priority,
      image_url, attachment_url, publish_date, expiry_date, status
    } = req.body;
    
    const { rows: [notification] } = await pool.query(
      `UPDATE notifications
       SET title = COALESCE($1, title),
           message = COALESCE($2, message),
           type = COALESCE($3, type),
           audience = COALESCE($4, audience),
           priority = COALESCE($5, priority),
           image_url = COALESCE($6, image_url),
           attachment_url = COALESCE($7, attachment_url),
           publish_date = COALESCE($8, publish_date),
           expiry_date = COALESCE($9, expiry_date),
           status = COALESCE($10, status)
       WHERE id = $11 AND church_id = $12
       RETURNING *`,
      [
        title, message, type, audience, priority, image_url, attachment_url,
        publish_date, expiry_date, status, req.params.id, req.churchId
      ]
    );
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    // If changed to published, deliver to users
    if (status === 'published' && !notification.email_sent) {
      await deliverNotification(notification);
    }
    
    res.json({ notification });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/notifications/admin/:id - Delete notification (admin)
router.delete('/admin/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND church_id = $2 RETURNING id',
      [req.params.id, req.churchId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ message: 'Notification deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notifications/admin/:id/publish - Publish notification (admin)
router.post('/admin/:id/publish', authenticate, requireAdmin, async (req, res) => {
  try {
    const { rows: [notification] } = await pool.query(
      `UPDATE notifications
       SET status = 'published', publish_date = NOW()
       WHERE id = $1 AND church_id = $2
       RETURNING *`,
      [req.params.id, req.churchId]
    );
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    // Deliver notification to users
    const result = await deliverNotification(notification);
    
    res.json({ 
      notification, 
      delivered: result.delivered,
      message: `Notification published and delivered to ${result.delivered} users`
    });
  } catch (err) {
    console.error('[POST /notifications/admin/:id/publish]', err);
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════

async function deliverNotification(notification) {
  try {
    // Get target users based on audience
    let userQuery = `
      SELECT id, email, first_name, last_name, role
      FROM users
      WHERE church_id = $1 AND approval_status = 'approved'
    `;
    
    const params = [notification.church_id];
    
    if (notification.audience === 'members') {
      userQuery += ` AND role = 'member'`;
    } else if (notification.audience === 'choir') {
      userQuery += ` AND role IN ('choir_member', 'choir')`;
    } else if (notification.audience === 'leaders') {
      userQuery += ` AND role IN ('admin', 'subadmin', 'leader')`;
    } else if (notification.audience === 'admin') {
      userQuery += ` AND role IN ('admin', 'subadmin')`;
    }
    // 'all' gets everyone
    
    const { rows: users } = await pool.query(userQuery, params);
    
    // Create notification delivery records
    for (const user of users) {
      await pool.query(
        `INSERT INTO notification_delivery (notification_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT (notification_id, user_id) DO NOTHING`,
        [notification.id, user.id]
      );
      
      // Send email notification
      try {
        await sendEmail({
          to: user.email,
          subject: `${getPriorityEmoji(notification.priority)} ${notification.title}`,
          html: generateNotificationEmail(notification, user)
        });
        
        // Mark email as sent
        await pool.query(
          `UPDATE notification_delivery
           SET email_sent = TRUE, email_sent_at = NOW()
           WHERE notification_id = $1 AND user_id = $2`,
          [notification.id, user.id]
        );
      } catch (emailErr) {
        console.error(`Failed to send email to ${user.email}:`, emailErr.message);
      }
    }
    
    // Update notification counts
    await pool.query(
      `UPDATE notifications
       SET delivered_count = $1, email_sent = TRUE
       WHERE id = $2`,
      [users.length, notification.id]
    );
    
    return { delivered: users.length };
  } catch (err) {
    console.error('[deliverNotification]', err);
    throw err;
  }
}

function getPriorityEmoji(priority) {
  switch (priority) {
    case 'urgent': return '🚨';
    case 'high': return '⚠️';
    case 'normal': return '📢';
    case 'low': return 'ℹ️';
    default: return '📢';
  }
}

function generateNotificationEmail(notification, user) {
  const priorityColors = {
    urgent: '#dc2626',
    high: '#ea580c',
    normal: '#7c3aed',
    low: '#6b7280'
  };
  
  const color = priorityColors[notification.priority] || priorityColors.normal;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${color}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
        .priority { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
        .btn { display: inline-block; padding: 12px 24px; background: ${color}; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        ${notification.image_url ? '.image { width: 100%; max-width: 500px; border-radius: 8px; margin: 20px 0; }' : ''}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="margin: 0;">${getPriorityEmoji(notification.priority)} ${notification.title}</h2>
        </div>
        <div class="content">
          <p>Hello <strong>${user.first_name}</strong>,</p>
          ${notification.image_url ? `<img src="${notification.image_url}" alt="Notification image" class="image" />` : ''}
          <div style="white-space: pre-wrap;">${notification.message}</div>
          ${notification.attachment_url ? `<p><a href="${notification.attachment_url}" style="color: ${color};">📎 View Attachment</a></p>` : ''}
          <a href="${process.env.FRONTEND_URL}/dashboard" class="btn">View in Dashboard</a>
        </div>
        <div class="footer">
          <p>This is an automated notification from LUS4G Church Management System.</p>
          <p>Priority: <span class="priority">${notification.priority.toUpperCase()}</span></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

module.exports = router;
