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

// GET /api/attendance/:sessionId/respond - Quick response from email link (no auth required)
router.get('/:sessionId/respond', async (req, res) => {
  try {
    const { response, user } = req.query;
    
    if (!response || !user || !['attending', 'not_attending'].includes(response)) {
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=invalid_response`);
    }
    
    // Verify session exists and is open
    const { rows: [session] } = await pool.query(
      'SELECT * FROM attendance_sessions WHERE id = $1 AND status = \'open\'',
      [req.params.sessionId]
    );
    
    if (!session) {
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=session_not_found`);
    }
    
    // Update or insert response
    await pool.query(
      `INSERT INTO attendance_responses 
        (session_id, user_id, church_id, response)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (session_id, user_id)
       DO UPDATE SET 
         response = EXCLUDED.response,
         responded_at = NOW()`,
      [req.params.sessionId, user, session.church_id, response]
    );
    
    // Redirect to dashboard with success message
    const message = response === 'attending' ? 'attendance_confirmed' : 'response_recorded';
    return res.redirect(`${process.env.FRONTEND_URL}/dashboard?success=${message}&session=${session.title}`);
  } catch (err) {
    console.error('[GET /attendance/:sessionId/respond]', err);
    return res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=response_failed`);
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
        m.first_name as creator_first_name,
        m.last_name as creator_last_name,
        COUNT(DISTINCT ar.id) as response_count,
        COUNT(DISTINCT CASE WHEN ar.response = 'attending' THEN ar.id END) as confirmed_count,
        COUNT(DISTINCT CASE WHEN ar.response = 'not_attending' THEN ar.id END) as declined_count
      FROM attendance_sessions ats
      LEFT JOIN users u ON ats.created_by = u.id
      LEFT JOIN members m ON m.user_id = u.id
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
    
    query += ` GROUP BY ats.id, m.first_name, m.last_name
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
        m.first_name,
        m.last_name,
        u.email,
        u.role,
        m.profile_photo_url
       FROM attendance_responses ar
       JOIN users u ON ar.user_id = u.id
       LEFT JOIN members m ON m.user_id = u.id
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
    // Get session AND church logo from cms_settings
    const { rows: [session] } = await pool.query(
      `SELECT ats.*,
              COALESCE(
                (SELECT value FROM cms_settings WHERE church_id = ats.church_id AND key = 'site_logo_url' LIMIT 1),
                ''
              ) as church_logo,
              COALESCE(
                (SELECT value FROM cms_settings WHERE church_id = ats.church_id AND key = 'footer_church_name' LIMIT 1),
                (SELECT value FROM cms_settings WHERE church_id = ats.church_id AND key = 'church_name' LIMIT 1),
                'LUS4G Church'
              ) as church_name
       FROM attendance_sessions ats
       WHERE ats.id = $1 AND ats.church_id = $2`,
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
    
    // Get all approved users with their choir details
    const { rows: users } = await pool.query(
      `SELECT 
         u.id, 
         m.email, 
         m.first_name, 
         m.last_name, 
         u.role,
         cm.choir_role,
         cm.voice_group
       FROM members m
       INNER JOIN users u ON u.id = m.user_id
       LEFT JOIN choir_members cm ON m.id = cm.member_id AND cm.is_active = TRUE
       WHERE m.church_id = $1 AND m.approval_status = 'approved' AND m.deleted_at IS NULL`,
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
          subject: `📅 ${session.church_name} Attendance Invitation: ${session.title}`,
          html: generateAttendanceInvitationEmail(session, user)
        });
        sentCount++;
        console.log(`[Attendance] Invitation sent to ${user.first_name} ${user.last_name} (${user.email})`);
      } catch (emailErr) {
        console.error(`[Attendance] Failed to send invitation to ${user.email}:`, emailErr.message);
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
    
    console.log(`[Attendance] Invitation sent to ${sentCount}/${users.length} users for session: ${session.title}`);
    
    res.json({ 
      message: `Invitation sent to ${sentCount} users`,
      sent_count: sentCount,
      total_users: users.length,
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
  
  // Build choir badge if user is choir member
  const choirBadge = user.choir_role ? `
    <div style="display: inline-block; background: linear-gradient(135deg, #ec4899, #f472b6); color: white; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-left: 10px;">
      🎵 ${user.voice_group || 'Choir Member'}
    </div>
  ` : '';
  
  // Build church logo if available
  const churchLogo = session.church_logo ? `
    <img src="${session.church_logo}" alt="${session.church_name}" style="max-width: 80px; max-height: 80px; margin-bottom: 15px; border-radius: 8px;" />
  ` : '';
  
  const baseUrl = process.env.FRONTEND_URL || 'https://lus4g-church-platform.vercel.app';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 40px 30px; text-align: center; }
        .content { padding: 40px 30px; background: #ffffff; }
        .church-info { text-align: center; margin-bottom: 20px; }
        .church-name { font-size: 20px; font-weight: bold; color: #7c3aed; margin: 10px 0; }
        .greeting { font-size: 18px; color: #374151; margin-bottom: 20px; }
        .verse { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 4px; }
        .verse-text { margin: 0; font-size: 15px; line-height: 1.8; font-style: italic; color: #78350f; }
        .verse-ref { margin: 10px 0 0 0; text-align: right; font-weight: bold; color: #f59e0b; font-size: 14px; }
        .encouragement { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 4px; }
        .encouragement-title { margin: 0 0 10px 0; font-size: 15px; font-weight: bold; color: #1e40af; }
        .encouragement-text { margin: 0; color: #1e3a8a; line-height: 1.7; }
        .details { background: #f9fafb; padding: 25px; border-radius: 8px; margin: 25px 0; border: 1px solid #e5e7eb; }
        .details-title { margin: 0 0 20px 0; color: #7c3aed; font-size: 18px; font-weight: bold; }
        .detail-row { margin: 12px 0; font-size: 15px; color: #4b5563; }
        .detail-label { font-weight: 600; color: #1f2937; display: inline-block; min-width: 80px; }
        .buttons { text-align: center; margin: 40px 0; }
        .btn { display: inline-block; padding: 16px 32px; margin: 8px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; transition: transform 0.2s; }
        .btn-attend { background: linear-gradient(135deg, #10b981, #059669); color: white; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); }
        .btn-attend:hover { transform: translateY(-2px); }
        .btn-decline { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3); }
        .btn-decline:hover { transform: translateY(-2px); }
        .dashboard-link { text-align: center; margin: 30px 0; padding: 20px; background: #f3f4f6; border-radius: 8px; }
        .footer { background: #1f2937; color: #9ca3af; padding: 30px; text-align: center; font-size: 13px; line-height: 1.8; }
        .footer-church { color: #d1d5db; font-weight: 600; font-size: 14px; margin-bottom: 10px; }
        @media only screen and (max-width: 600px) {
          .content { padding: 30px 20px; }
          .btn { display: block; margin: 10px 0; }
          .detail-label { display: block; margin-bottom: 5px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          ${churchLogo}
          <h1 style="margin: 0; font-size: 32px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">📅 You're Invited!</h1>
          <p style="margin: 15px 0 0 0; font-size: 20px; opacity: 0.95;">${session.title}</p>
        </div>
        
        <div class="content">
          <div class="church-info">
            <div class="church-name">${session.church_name}</div>
          </div>
          
          <div class="greeting">
            Hello <strong>${user.first_name} ${user.last_name}</strong>${choirBadge}
          </div>
          
          <p style="font-size: 16px; color: #4b5563; line-height: 1.7;">
            You are warmly invited to join us for <strong style="color: #7c3aed;">${session.title}</strong>. 
            Your presence will be a blessing as we gather together in fellowship and worship.
          </p>
          
          <div class="verse">
            <p class="verse-text">"${session.invitation_verse}"</p>
            <p class="verse-ref">— ${session.invitation_verse_reference}</p>
          </div>
          
          <div class="encouragement">
            <p class="encouragement-title">💡 A Word of Encouragement</p>
            <p class="encouragement-text">${session.encouragement_message}</p>
          </div>
          
          <div class="details">
            <h3 class="details-title">📋 Event Details</h3>
            <div class="detail-row">
              <span class="detail-label">📅 Date:</span>
              <span>${eventDate}</span>
            </div>
            ${session.start_time ? `
            <div class="detail-row">
              <span class="detail-label">🕐 Time:</span>
              <span>${session.start_time}${session.end_time ? ' - ' + session.end_time : ''}</span>
            </div>
            ` : ''}
            ${session.venue ? `
            <div class="detail-row">
              <span class="detail-label">📍 Venue:</span>
              <span>${session.venue}</span>
            </div>
            ` : ''}
            <div class="detail-row">
              <span class="detail-label">📂 Type:</span>
              <span style="text-transform: capitalize;">${session.attendance_type.replace(/_/g, ' ')}</span>
            </div>
            ${session.description ? `
            <div class="detail-row" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <span class="detail-label" style="display: block; margin-bottom: 10px;">Details:</span>
              <p style="margin: 0; color: #6b7280; line-height: 1.7;">${session.description}</p>
            </div>
            ` : ''}
          </div>
          
          <p style="text-align: center; font-size: 16px; font-weight: 600; color: #7c3aed; margin: 30px 0 20px 0;">
            Please confirm your attendance:
          </p>
          
          <div class="buttons">
            <a href="${baseUrl}/api/attendance/${session.id}/respond?response=attending&user=${user.id}" class="btn btn-attend">
              ✅ Yes, I Will Attend
            </a>
            <a href="${baseUrl}/api/attendance/${session.id}/respond?response=not_attending&user=${user.id}" class="btn btn-decline">
              ❌ Sorry, I Cannot Attend
            </a>
          </div>
          
          <div class="dashboard-link">
            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
              You can also respond and manage your attendance from your dashboard:
            </p>
            <a href="${baseUrl}/dashboard" style="color: #7c3aed; font-weight: 600; text-decoration: none; font-size: 15px;">
              🏠 Go to Dashboard →
            </a>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-church">${session.church_name}</div>
          <p style="margin: 5px 0;">
            This is an automated attendance invitation from ${session.church_name} Management System.
          </p>
          <p style="margin: 5px 0;">
            Please respond at your earliest convenience. Your participation matters!
          </p>
          <p style="margin: 15px 0 5px 0; font-size: 12px; color: #6b7280;">
            © ${new Date().getFullYear()} ${session.church_name}. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

module.exports = router;
