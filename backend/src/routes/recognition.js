const router = require('express').Router();
const pool = require('../lib/db');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { sendEmail } = require('../lib/email');

// ══════════════════════════════════════════════════════════════
// PUBLIC ENDPOINTS - View published recognitions
// ══════════════════════════════════════════════════════════════

// GET /api/recognition/public - Get published recognitions
router.get('/public', async (req, res) => {
  try {
    const churchId = req.query.church_id || process.env.DEFAULT_CHURCH_ID;
    const { limit = 10 } = req.query;
    
    const { rows } = await pool.query(
      `SELECT 
        r.*,
        u.first_name,
        u.last_name,
        u.profile_photo_url,
        u.role
       FROM recognitions r
       JOIN users u ON r.user_id = u.id
       WHERE r.church_id = $1 
         AND r.is_published = TRUE
       ORDER BY r.is_featured DESC, r.published_at DESC, r.created_at DESC
       LIMIT $2`,
      [churchId, parseInt(limit)]
    );
    
    res.json({ recognitions: rows });
  } catch (err) {
    console.error('[GET /recognition/public]', err);
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// MEMBER ENDPOINTS - View own recognitions
// ══════════════════════════════════════════════════════════════

// GET /api/recognition/my-awards - Get user's recognitions
router.get('/my-awards', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM recognitions
       WHERE user_id = $1 AND church_id = $2
       ORDER BY created_at DESC`,
      [req.user.id, req.churchId]
    );
    
    res.json({ recognitions: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// ADMIN ENDPOINTS - Manage recognitions
// ══════════════════════════════════════════════════════════════

// GET /api/recognition/admin/all - Get all recognitions (admin)
router.get('/admin/all', authenticate, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, published } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let query = `
      SELECT 
        r.*,
        u.first_name,
        u.last_name,
        u.email,
        u.profile_photo_url,
        u.role,
        creator.first_name as creator_first_name,
        creator.last_name as creator_last_name
      FROM recognitions r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN users creator ON r.created_by = creator.id
      WHERE r.church_id = $1
    `;
    
    const params = [req.churchId];
    
    if (published !== undefined) {
      query += ` AND r.is_published = $${params.length + 1}`;
      params.push(published === 'true');
    }
    
    query += ` ORDER BY r.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);
    
    const { rows } = await pool.query(query, params);
    
    const { rows: [count] } = await pool.query(
      'SELECT COUNT(*) as total FROM recognitions WHERE church_id = $1',
      [req.churchId]
    );
    
    res.json({
      recognitions: rows,
      total: parseInt(count.total),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    console.error('[GET /recognition/admin/all]', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/recognition/admin - Create recognition (admin)
router.post('/admin', authenticate, requireAdmin, async (req, res) => {
  try {
    const {
      user_id,
      title,
      category,
      description,
      recognition_month,
      attendance_percentage
    } = req.body;
    
    if (!user_id || !title || !category || !description) {
      return res.status(400).json({ error: 'User, title, category, and description are required' });
    }
    
    const { rows: [recognition] } = await pool.query(
      `INSERT INTO recognitions 
        (church_id, user_id, title, category, description, recognition_month, 
         attendance_percentage, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        req.churchId, user_id, title, category, description,
        recognition_month || new Date().toISOString().split('T')[0],
        attendance_percentage || null, req.user.id
      ]
    );
    
    res.status(201).json({ recognition });
  } catch (err) {
    console.error('[POST /recognition/admin]', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/recognition/admin/:id - Update recognition (admin)
router.put('/admin/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const {
      title, category, description, recognition_month,
      attendance_percentage, is_published, is_featured
    } = req.body;
    
    const { rows: [recognition] } = await pool.query(
      `UPDATE recognitions
       SET title = COALESCE($1, title),
           category = COALESCE($2, category),
           description = COALESCE($3, description),
           recognition_month = COALESCE($4, recognition_month),
           attendance_percentage = COALESCE($5, attendance_percentage),
           is_published = COALESCE($6, is_published),
           is_featured = COALESCE($7, is_featured)
       WHERE id = $8 AND church_id = $9
       RETURNING *`,
      [
        title, category, description, recognition_month,
        attendance_percentage, is_published, is_featured,
        req.params.id, req.churchId
      ]
    );
    
    if (!recognition) {
      return res.status(404).json({ error: 'Recognition not found' });
    }
    
    res.json({ recognition });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/recognition/admin/:id - Delete recognition (admin)
router.delete('/admin/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM recognitions WHERE id = $1 AND church_id = $2 RETURNING id',
      [req.params.id, req.churchId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Recognition not found' });
    }
    
    res.json({ message: 'Recognition deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/recognition/admin/:id/publish - Publish recognition (admin)
router.post('/admin/:id/publish', authenticate, requireAdmin, async (req, res) => {
  try {
    // Get recognition with user details
    const { rows: [recognition] } = await pool.query(
      `SELECT r.*, u.first_name, u.last_name, u.email, u.profile_photo_url
       FROM recognitions r
       JOIN users u ON r.user_id = u.id
       WHERE r.id = $1 AND r.church_id = $2`,
      [req.params.id, req.churchId]
    );
    
    if (!recognition) {
      return res.status(404).json({ error: 'Recognition not found' });
    }
    
    // Update recognition to published
    await pool.query(
      `UPDATE recognitions
       SET is_published = TRUE, published_at = NOW()
       WHERE id = $1`,
      [req.params.id]
    );
    
    // Send email to the recognized user
    try {
      await sendEmail({
        to: recognition.email,
        subject: '⭐ Congratulations! You\'ve Been Recognized',
        html: generateRecognitionEmail(recognition)
      });
    } catch (emailErr) {
      console.error('Failed to send recognition email:', emailErr.message);
    }
    
    // Create notification for all users
    const { rows: [notification] } = await pool.query(
      `INSERT INTO notifications 
        (church_id, title, message, type, audience, priority, sender_id, status, publish_date)
       VALUES ($1, $2, $3, 'announcement', 'all', 'normal', $4, 'published', NOW())
       RETURNING *`,
      [
        req.churchId,
        '⭐ Member Recognition',
        `Congratulations to ${recognition.first_name} ${recognition.last_name} for ${recognition.title}!\n\n${recognition.description}`,
        req.user.id
      ]
    );
    
    // Deliver notification to all users
    const { rows: users } = await pool.query(
      `SELECT id, email, first_name, last_name
       FROM users
       WHERE church_id = $1 AND approval_status = 'approved'`,
      [req.churchId]
    );
    
    for (const user of users) {
      await pool.query(
        `INSERT INTO notification_delivery (notification_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT (notification_id, user_id) DO NOTHING`,
        [notification.id, user.id]
      );
    }
    
    res.json({ 
      message: 'Recognition published successfully',
      recognition,
      notification_sent: true
    });
  } catch (err) {
    console.error('[POST /recognition/admin/:id/publish]', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/recognition/admin/generate - Auto-generate recognitions (admin)
router.post('/admin/generate', authenticate, requireAdmin, async (req, res) => {
  try {
    const { month } = req.body;
    const recognitionMonth = month || new Date().toISOString().split('T')[0].substring(0, 7) + '-01';
    
    const recognitions = [];
    
    // Highest Attendance Member
    const { rows: [topMember] } = await pool.query(
      `SELECT 
        ar.user_id,
        u.first_name,
        u.last_name,
        u.role,
        COUNT(*) as total_invitations,
        COUNT(CASE WHEN ar.response = 'attending' THEN 1 END) as attended_count,
        ROUND(
          (COUNT(CASE WHEN ar.response = 'attending' THEN 1 END)::DECIMAL / 
           NULLIF(COUNT(*), 0)) * 100, 
          2
        ) as attendance_percentage
       FROM attendance_responses ar
       JOIN users u ON ar.user_id = u.id
       WHERE ar.church_id = $1
         AND u.role = 'member'
         AND ar.responded_at >= DATE_TRUNC('month', $2::DATE)
         AND ar.responded_at < DATE_TRUNC('month', $2::DATE) + INTERVAL '1 month'
       GROUP BY ar.user_id, u.first_name, u.last_name, u.role
       HAVING COUNT(*) >= 3
       ORDER BY attendance_percentage DESC, attended_count DESC
       LIMIT 1`,
      [req.churchId, recognitionMonth]
    );
    
    if (topMember && topMember.attendance_percentage >= 80) {
      const { rows: [rec] } = await pool.query(
        `INSERT INTO recognitions 
          (church_id, user_id, title, category, description, recognition_month, 
           attendance_percentage, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT DO NOTHING
         RETURNING *`,
        [
          req.churchId,
          topMember.user_id,
          'Highest Attendance Member',
          'highest_attendance_member',
          `Congratulations to ${topMember.first_name} ${topMember.last_name} for maintaining outstanding attendance with ${topMember.attendance_percentage}% attendance rate this month. Thank you for your dedication and faithful commitment to church activities.`,
          recognitionMonth,
          topMember.attendance_percentage,
          req.user.id
        ]
      );
      if (rec) recognitions.push(rec);
    }
    
    // Highest Attendance Choir Member
    const { rows: [topChoir] } = await pool.query(
      `SELECT 
        ar.user_id,
        u.first_name,
        u.last_name,
        u.role,
        COUNT(*) as total_invitations,
        COUNT(CASE WHEN ar.response = 'attending' THEN 1 END) as attended_count,
        ROUND(
          (COUNT(CASE WHEN ar.response = 'attending' THEN 1 END)::DECIMAL / 
           NULLIF(COUNT(*), 0)) * 100, 
          2
        ) as attendance_percentage
       FROM attendance_responses ar
       JOIN users u ON ar.user_id = u.id
       WHERE ar.church_id = $1
         AND u.role IN ('choir_member', 'choir')
         AND ar.responded_at >= DATE_TRUNC('month', $2::DATE)
         AND ar.responded_at < DATE_TRUNC('month', $2::DATE) + INTERVAL '1 month'
       GROUP BY ar.user_id, u.first_name, u.last_name, u.role
       HAVING COUNT(*) >= 3
       ORDER BY attendance_percentage DESC, attended_count DESC
       LIMIT 1`,
      [req.churchId, recognitionMonth]
    );
    
    if (topChoir && topChoir.attendance_percentage >= 80) {
      const { rows: [rec] } = await pool.query(
        `INSERT INTO recognitions 
          (church_id, user_id, title, category, description, recognition_month, 
           attendance_percentage, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT DO NOTHING
         RETURNING *`,
        [
          req.churchId,
          topChoir.user_id,
          'Highest Attendance Choir Member',
          'highest_attendance_choir',
          `Congratulations to ${topChoir.first_name} ${topChoir.last_name} for exceptional dedication to choir activities with ${topChoir.attendance_percentage}% attendance rate. Your commitment to worship through music is truly inspiring.`,
          recognitionMonth,
          topChoir.attendance_percentage,
          req.user.id
        ]
      );
      if (rec) recognitions.push(rec);
    }
    
    res.json({
      message: `Generated ${recognitions.length} recognitions`,
      recognitions
    });
  } catch (err) {
    console.error('[POST /recognition/admin/generate]', err);
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════

function generateRecognitionEmail(recognition) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 40px; border-radius: 8px 8px 0 0; text-align: center; }
        .star { font-size: 48px; margin-bottom: 10px; }
        .content { background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; }
        .award-badge { background: #fef3c7; border: 3px solid #f59e0b; border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center; }
        .award-title { font-size: 24px; font-weight: bold; color: #92400e; margin: 10px 0; }
        .award-category { font-size: 14px; color: #78350f; text-transform: uppercase; letter-spacing: 1px; }
        .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="star">⭐</div>
          <h1 style="margin: 0; font-size: 32px;">Congratulations!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">You've Been Recognized</p>
        </div>
        <div class="content">
          <p>Dear <strong>${recognition.first_name} ${recognition.last_name}</strong>,</p>
          
          <p>We are delighted to inform you that you have been recognized for your outstanding contribution and commitment to our church community!</p>
          
          <div class="award-badge">
            <div class="award-category">${recognition.category.replace(/_/g, ' ')}</div>
            <div class="award-title">${recognition.title}</div>
            ${recognition.attendance_percentage ? `<div style="font-size: 28px; font-weight: bold; color: #f59e0b; margin-top: 15px;">${recognition.attendance_percentage}%</div>` : ''}
            ${recognition.attendance_percentage ? `<div style="font-size: 14px; color: #78350f;">Attendance Rate</div>` : ''}
          </div>
          
          <div style="background: #f3f4f6; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0;">
            <p style="margin: 0; font-size: 15px;">${recognition.description}</p>
          </div>
          
          <p>Your faithful service and dedication inspire others and contribute greatly to the life of our church. May God continue to bless you abundantly!</p>
          
          <p style="text-align: center; margin-top: 30px;">
            <strong>Recognition Month:</strong> ${new Date(recognition.recognition_month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div class="footer">
          <p>This recognition has been published to the church community.</p>
          <p>LUS4G Church Management System</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

module.exports = router;
