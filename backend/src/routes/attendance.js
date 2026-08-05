const router = require('express').Router();
const pool = require('../lib/db');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { sendEmail } = require('../lib/email');

// Encouragement messages by attendance type
const ENCOURAGEMENT_TEMPLATES = {
  sunday_service: "Let us gather together to worship and glorify God with one heart and voice.",
  midweek_service: "A midweek pause to refocus on God's presence and renew our faith.",
  friday_prayer: "Come together in prayer, seeking God's face and interceding for His church.",
  choir_practice: "As we gather to rehearse, may our worship prepare hearts to glorify God together.",
  choir_rehearsal: "Let every voice unite in harmony to magnify the Lord through music.",
  bible_study: "Study the Word together and grow deeper in understanding God's truth.",
  evangelism: "Go forth to share the Good News and be witnesses of God's love.",
  youth_meeting: "Young hearts gathering to encounter God and build lasting faith.",
  special_program: "A special time to celebrate God's goodness and grace in our midst.",
  other: "Join us as we gather in the name of the Lord."
};

// Bible verses for attendance invitations
const ATTENDANCE_VERSES = [
  { reference: 'Hebrews 10:25', text: 'Let us not give up meeting together, as some are in the habit of doing, but let us encourage one another—and all the more as you see the Day approaching.' },
  { reference: 'Psalm 122:1', text: 'I rejoiced with those who said to me, "Let us go to the house of the Lord."' },
  { reference: 'Matthew 18:20', text: 'For where two or three gather in my name, there am I with them.' },
  { reference: 'Psalm 133:1', text: 'How good and pleasant it is when God\'s people live together in unity!' },
  { reference: '1 Corinthians 16:13-14', text: 'Be on your guard; stand firm in the faith; be courageous; be strong. Do everything in love.' },
  { reference: 'Colossians 3:16', text: 'Let the message of Christ dwell among you richly as you teach and admonish one another with all wisdom through psalms, hymns, and songs from the Spirit, singing to God with gratitude in your hearts.' },
  { reference: 'Acts 2:46', text: 'Every day they continued to meet together in the temple courts. They broke bread in their homes and ate together with glad and sincere hearts.' }
];

// ══════════════════════════════════════════════════════════════
// MEMBER ENDPOINTS - View and respond to attendance
// ══════════════════════════════════════════════════════════════

// GET /api/attendance/my-invitations - Get user's attendance invitations
router.get('/my-invitations', authenticate, async (req, res) => {
  try {
    const { upcoming = 'true' } = req.query;
    
    let dateFilter = '';
    if (upcoming === 'true') {
      dateFilter = 'AND ats.event_date >= CURRENT_DATE';
    }
    
    const { rows } = await pool.query(
      `SELECT 
        ats.*,
        ar.response,
        ar.reason,
        ar.comment,
        ar.responded_at
       FROM attendance_sessions ats
       LEFT JOIN attendance_responses ar ON ats.id = ar.session_id AND ar.user_id = $1
       WHERE ats.church_id = $2
         AND ats.status = 'open'
         AND ats.invitation_sent = TRUE
         ${dateFilter}
       ORDER BY ats.event_date ASC, ats.start_time ASC`,
      [req.user.id, req.churchId]
    );
    
    res.json({ sessions: rows });
  } catch (err) {
    console.error('[GET /attendance/my-invitations]', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/attendance/my-stats - Get user's attendance statistics
router.get('/my-stats', authenticate, async (req, res) => {
  try {
    const { rows: [stats] } = await pool.query(
      `SELECT 
        COUNT(*) as total_invitations,
        COUNT(CASE WHEN response = 'attending' THEN 1 END) as attended_count,
        COUNT(CASE WHEN response = 'not_attending' THEN 1 END) as declined_count,
        COUNT(CASE WHEN response = 'pending' THEN 1 END) as pending_count,
        ROUND(
          (COUNT(CASE WHEN response = 'attending' THEN 1 END)::DECIMAL / 
           NULLIF(COUNT(*), 0)) * 100, 
          2
        ) as attendance_percentage
       FROM attendance_responses
       WHERE user_id = $1 AND church_id = $2`,
      [req.user.id, req.churchId]
    );
    
    res.json({ stats: stats || { total_invitations: 0, attended_count: 0, declined_count: 0, pending_count: 0, attendance_percentage: 0 } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/attendance/:sessionId/respond - Respond to attendance invitation
router.post('/:sessionId/respond', authenticate, async (req, res) => {
  try {
    const { response, reason, comment } = req.body;
    
    if (!response || !['attending', 'not_attending'].includes(response)) {
      return res.status(400).json({ error: 'Invalid response. Must be "attending" or "not_attending"' });
    }
    
    if (response === 'not_attending' && !reason) {
      return res.status(400).json({ error: 'Reason is required when declining attendance' });
    }
    
    // Check if session exists and is open
    const { rows: [session] } = await pool.query(
      'SELECT * FROM attendance_sessions WHERE id = $1 AND church_id = $2 AND status = \'open\'',
      [req.params.sessionId, req.churchId]
    );
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found or closed' });
    }
    
    // Insert or update response
    const { rows: [attendanceResponse] } = await pool.query(
      `INSERT INTO attendance_responses 
        (session_id, user_id, church_id, response, reason, comment)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (session_id, user_id)
       DO UPDATE SET 
         response = EXCLUDED.response,
         reason = EXCLUDED.reason,
         comment = EXCLUDED.comment,
         responded_at = NOW()
       RETURNING *`,
      [req.params.sessionId, req.user.id, req.churchId, response, reason || null, comment || null]
    );
    
    res.json({ 
      message: response === 'attending' ? 'Attendance confirmed!' : 'Response recorded',
      response: attendanceResponse 
    });
  } catch (err) {
    console.error('[POST /attendance/:sessionId/respond]', err);
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// ADMIN ENDPOINTS - Manage attendance sessions
// ══════════════════════════════════════════════════════════════

// GET /api/attendance/admin/sessions - Get all sessions (admin)
router.get('/admin/sessions', authenticate, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, status, type } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let query = `
      SELECT 
        ats.*,
        u.first_name as creator_first_name,
        u.last_name as creator_last_name,
        COUNT(DISTINCT ar.id) as response_count,
        COUNT(DISTINCT CASE WHEN ar.response = 'attending' THEN ar.id END) as confirmed_count,
        COUNT(DISTINCT CASE WHEN ar.response = 'not_attending' THEN ar.id END) as declined_count
      FROM attendance_sessions ats
      LEFT JOIN users u ON ats.created_by = u.id
      LEFT JOIN attendance_responses ar ON ats.id = ar.session_id
      WHERE ats.church_id = $1
    `;
    
    const params = [req.churchId];
    
    if (status) {
      query += ` AND ats.status = $${params.length + 1}`;
      params.push(status);
    }
    
    if (type) {
      query += ` AND ats.attendance_type = $${params.length + 1}`;
      params.push(type);
    }
    
    query += ` GROUP BY ats.id, u.first_name, u.last_name
               ORDER BY ats.event_date DESC, ats.created_at DESC
               LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);
    
    const { rows } = await pool.query(query, params);
    
    const { rows: [count] } = await pool.query(
      'SELECT COUNT(*) as total FROM attendance_sessions WHERE church_id = $1',
      [req.churchId]
    );
    
    res.json({
      sessions: rows,
      total: parseInt(count.total),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    console.error('[GET /attendance/admin/sessions]', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/attendance/admin/sessions/:id - Get session details (admin)
router.get('/admin/sessions/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { rows: [session] } = await pool.query(
      'SELECT * FROM attendance_sessions WHERE id = $1 AND church_id = $2',
      [req.params.id, req.churchId]
    );
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Get responses
    const { rows: responses } = await pool.query(
      `SELECT 
        ar.*,
        u.first_name,
        u.last_name,
        u.email,
        u.role,
        u.profile_photo_url
       FROM attendance_responses ar
       JOIN users u ON ar.user_id = u.id
       WHERE ar.session_id = $1
       ORDER BY ar.responded_at DESC`,
      [req.params.id]
    );
    
    // Get stats
    const { rows: [stats] } = await pool.query(
      `SELECT 
        COUNT(*) as total_responses,
        COUNT(CASE WHEN response = 'attending' THEN 1 END) as confirmed_count,
        COUNT(CASE WHEN response = 'not_attending' THEN 1 END) as declined_count,
        COUNT(CASE WHEN response = 'pending' THEN 1 END) as pending_count,
        ROUND(
          (COUNT(CASE WHEN response = 'attending' THEN 1 END)::DECIMAL / 
           NULLIF(COUNT(*), 0)) * 100, 
          2
        ) as attendance_percentage
       FROM attendance_responses
       WHERE session_id = $1`,
      [req.params.id]
    );
    
    res.json({ session, responses, stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/attendance/admin/sessions - Create session (admin)
router.post('/admin/sessions', authenticate, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      attendance_type,
      event_date,
      start_time,
      end_time,
      venue,
      description,
      status = 'draft'
    } = req.body;
    
    if (!title || !attendance_type || !event_date) {
      return res.status(400).json({ error: 'Title, attendance type, and event date are required' });
    }
    
    const { rows: [session] } = await pool.query(
      `INSERT INTO attendance_sessions 
        (church_id, title, attendance_type, event_date, start_time, end_time, 
         venue, description, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        req.churchId, title, attendance_type, event_date, start_time || null,
        end_time || null, venue || null, description || null, status, req.user.id
      ]
    );
    
    res.status(201).json({ session });
  } catch (err) {
    console.error('[POST /attendance/admin/sessions]', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/attendance/admin/sessions/:id - Update session (admin)
router.put('/admin/sessions/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const {
      title, attendance_type, event_date, start_time, end_time,
      venue, description, status
    } = req.body;
    
    const { rows: [session] } = await pool.query(
      `UPDATE attendance_sessions
       SET title = COALESCE($1, title),
           attendance_type = COALESCE($2, attendance_type),
           event_date = COALESCE($3, event_date),
           start_time = COALESCE($4, start_time),
           end_time = COALESCE($5, end_time),
           venue = COALESCE($6, venue),
           description = COALESCE($7, description),
           status = COALESCE($8, status)
       WHERE id = $9 AND church_id = $10
       RETURNING *`,
      [
        title, attendance_type, event_date, start_time, end_time,
        venue, description, status, req.params.id, req.churchId
      ]
    );
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json({ session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/attendance/admin/sessions/:id - Delete session (admin)
router.delete('/admin/sessions/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM attendance_sessions WHERE id = $1 AND church_id = $2 RETURNING id',
      [req.params.id, req.churchId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json({ message: 'Session deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/attendance/admin/sessions/:id/send-invitation - Send invitation (admin)
router.post('/admin/sessions/:id/send-invitation', authenticate, requireAdmin, async (req, res) => {
  try {
    // Get session
    const { rows: [session] } = await pool.query(
      'SELECT * FROM attendance_sessions WHERE id = $1 AND church_id = $2',
      [req.params.id, req.churchId]
    );
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Generate verse and encouragement if not already set
    if (!session.invitation_verse) {
      const verse = ATTENDANCE_VERSES[Math.floor(Math.random() * ATTENDANCE_VERSES.length)];
      const encouragement = ENCOURAGEMENT_TEMPLATES[session.attendance_type] || ENCOURAGEMENT_TEMPLATES.other;
      
      await pool.query(
        `UPDATE attendance_sessions
         SET invitation_verse = $1,
             invitation_verse_reference = $2,
             encouragement_message = $3
         WHERE id = $4`,
        [verse.text, verse.reference, encouragement, session.id]
      );
      
      session.invitation_verse = verse.text;
      session.invitation_verse_reference = verse.reference;
      session.encouragement_message = encouragement;
    }
    
    // Get all approved users
    const { rows: users } = await pool.query(
      `SELECT id, email, first_name, last_name, role
       FROM users
       WHERE church_id = $1 AND approval_status = 'approved'`,
      [req.churchId]
    );
    
    let sentCount = 0;
    
    // Create pending responses and send emails
    for (const user of users) {
      // Create attendance response with pending status
      await pool.query(
        `INSERT INTO attendance_responses (session_id, user_id, church_id, response)
         VALUES ($1, $2, $3, 'pending')
         ON CONFLICT (session_id, user_id) DO NOTHING`,
        [session.id, user.id, req.churchId]
      );
      
      // Send email invitation
      try {
        await sendEmail({
          to: user.email,
          subject: `📅 Attendance Invitation: ${session.title}`,
          html: generateAttendanceInvitationEmail(session, user)
        });
        sentCount++;
      } catch (emailErr) {
        console.error(`Failed to send invitation to ${user.email}:`, emailErr.message);
      }
    }
    
    // Update session
    await pool.query(
      `UPDATE attendance_sessions
       SET invitation_sent = TRUE,
           invitation_sent_at = NOW(),
           status = 'open'
       WHERE id = $1`,
      [session.id]
    );
    
    res.json({ 
      message: `Invitation sent to ${sentCount} users`,
      sent_count: sentCount,
      session
    });
  } catch (err) {
    console.error('[POST /attendance/admin/sessions/:id/send-invitation]', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/attendance/admin/stats - Get overall attendance stats (admin)
router.get('/admin/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const { rows: [stats] } = await pool.query(
      `SELECT 
        COUNT(DISTINCT ats.id) as total_sessions,
        COUNT(DISTINCT CASE WHEN ats.status = 'open' THEN ats.id END) as open_sessions,
        COUNT(DISTINCT ar.id) as total_responses,
        COUNT(DISTINCT CASE WHEN ar.response = 'attending' THEN ar.id END) as total_confirmed,
        COUNT(DISTINCT CASE WHEN ar.response = 'not_attending' THEN ar.id END) as total_declined,
        ROUND(
          (COUNT(DISTINCT CASE WHEN ar.response = 'attending' THEN ar.id END)::DECIMAL / 
           NULLIF(COUNT(DISTINCT ar.id), 0)) * 100, 
          2
        ) as overall_attendance_percentage
       FROM attendance_sessions ats
       LEFT JOIN attendance_responses ar ON ats.id = ar.session_id
       WHERE ats.church_id = $1`,
      [req.churchId]
    );
    
    res.json({ stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════

function generateAttendanceInvitationEmail(session, user) {
  const eventDate = new Date(session.event_date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
        .verse { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; font-style: italic; }
        .encouragement { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; }
        .details { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { margin: 10px 0; }
        .label { font-weight: bold; color: #6b7280; }
        .buttons { text-align: center; margin: 30px 0; }
        .btn { display: inline-block; padding: 14px 28px; margin: 0 10px; text-decoration: none; border-radius: 6px; font-weight: bold; }
        .btn-attend { background: #10b981; color: white; }
        .btn-decline { background: #ef4444; color: white; }
        .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">📅 You're Invited!</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">${session.title}</p>
        </div>
        <div class="content">
          <p>Hello <strong>${user.first_name}</strong>,</p>
          
          <p>You are invited to join us for <strong>${session.title}</strong>. We would love to have you with us!</p>
          
          <div class="verse">
            <p style="margin: 0; font-size: 16px; line-height: 1.8;">${session.invitation_verse}</p>
            <p style="margin: 10px 0 0 0; text-align: right; font-weight: bold; color: #f59e0b;">— ${session.invitation_verse_reference}</p>
          </div>
          
          <div class="encouragement">
            <p style="margin: 0; font-size: 15px;">💡 <strong>Encouragement:</strong></p>
            <p style="margin: 10px 0 0 0;">${session.encouragement_message}</p>
          </div>
          
          <div class="details">
            <h3 style="margin: 0 0 15px 0; color: #7c3aed;">Event Details</h3>
            <div class="detail-row"><span class="label">📅 Date:</span> ${eventDate}</div>
            ${session.start_time ? `<div class="detail-row"><span class="label">🕐 Time:</span> ${session.start_time}${session.end_time ? ' - ' + session.end_time : ''}</div>` : ''}
            ${session.venue ? `<div class="detail-row"><span class="label">📍 Venue:</span> ${session.venue}</div>` : ''}
            ${session.description ? `<div class="detail-row" style="margin-top: 15px;"><span class="label">Details:</span><br/>${session.description}</div>` : ''}
          </div>
          
          <div class="buttons">
            <a href="${process.env.FRONTEND_URL}/dashboard/attendance/${session.id}/respond?response=attending" class="btn btn-attend">✓ I Will Attend</a>
            <a href="${process.env.FRONTEND_URL}/dashboard/attendance/${session.id}/respond?response=not_attending" class="btn btn-decline">✗ I Cannot Attend</a>
          </div>
          
          <p style="text-align: center; color: #6b7280; font-size: 14px;">Or respond directly from your <a href="${process.env.FRONTEND_URL}/dashboard" style="color: #7c3aed;">Dashboard</a></p>
        </div>
        <div class="footer">
          <p>This is an automated attendance invitation from LUS4G Church Management System.</p>
          <p>Please respond at your earliest convenience.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

module.exports = router;
