const router = require('express').Router();
const pool   = require('../lib/db');
const { authenticate, requireAdmin, requireSameChurch } = require('../middleware/auth');

// GET /api/choir
router.get('/', authenticate, requireSameChurch, async (req, res) => {
  try {
    const { approval_status, voice_group } = req.query;
    let q = `SELECT cm.*, m.first_name, m.last_name, m.member_code,
               m.profile_photo_url, m.email, m.phone, m.date_of_birth
             FROM choir_members cm JOIN members m ON m.id=cm.member_id
             WHERE cm.church_id=$1`;
    const params = [req.churchId]; let idx = 2;
    if (approval_status) { q += ` AND cm.approval_status=$${idx++}`; params.push(approval_status); }
    if (voice_group)     { q += ` AND cm.voice_group=$${idx++}`;     params.push(voice_group); }
    q += ' ORDER BY cm.voice_group, m.last_name';
    const { rows } = await pool.query(q, params);
    res.json({ choir: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/choir/register
router.post('/register', authenticate, async (req, res) => {
  try {
    const {
      member_id, voice_group, choir_role = 'choir_member',
      experience_level, instruments = [], choir_activities = [], main_role, notes,
    } = req.body;
    if (!member_id || !voice_group)
      return res.status(400).json({ error: 'member_id and voice_group required' });

    const exists = await pool.query('SELECT id FROM choir_members WHERE member_id=$1', [member_id]);
    if (exists.rows[0]) return res.status(409).json({ error: 'Already registered in choir' });

    const { rows: [m] } = await pool.query('SELECT church_id FROM members WHERE id=$1', [member_id]);
    if (!m) return res.status(404).json({ error: 'Member not found' });

    const { rows: [cm] } = await pool.query(
      `INSERT INTO choir_members
         (member_id, church_id, voice_group, choir_role, experience_level,
          instruments, choir_activities, main_role, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [member_id, m.church_id, voice_group, choir_role, experience_level,
       instruments, choir_activities, main_role, notes]
    );
    res.status(201).json({ choir_member: cm });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/choir/rehearsals
router.get('/rehearsals', authenticate, requireSameChurch, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM rehearsals WHERE church_id=$1 ORDER BY rehearsal_date DESC`,
      [req.churchId]
    );
    res.json({ rehearsals: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/choir/rehearsals
router.post('/rehearsals', authenticate, requireAdmin, requireSameChurch, async (req, res) => {
  try {
    const { title, description, rehearsal_date, start_time, end_time, location, notes } = req.body;
    if (!title || !rehearsal_date)
      return res.status(400).json({ error: 'title and rehearsal_date required' });
    const { rows: [r] } = await pool.query(
      `INSERT INTO rehearsals
         (church_id,title,description,rehearsal_date,start_time,end_time,location,notes,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.churchId, title, description, rehearsal_date,
       start_time || null, end_time || null, location, notes, req.user.id]
    );
    res.status(201).json({ rehearsal: r });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/choir/rehearsals/:id
router.delete('/rehearsals/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM rehearsals WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/choir/music
router.get('/music', authenticate, requireSameChurch, async (req, res) => {
  try {
    const { search } = req.query;
    let q = `SELECT * FROM music_library WHERE church_id=$1`;
    const params = [req.churchId]; let idx = 2;
    if (search) {
      q += ` AND (title ILIKE $${idx} OR artist ILIKE $${idx})`;
      params.push(`%${search}%`);
    }
    q += ' ORDER BY title';
    const { rows } = await pool.query(q, params);
    res.json({ music: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/choir/music
router.post('/music', authenticate, requireAdmin, requireSameChurch, async (req, res) => {
  try {
    const { title, artist, genre, key_note, bpm, file_url, sheet_url,
      lyrics, duration_seconds, tags } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });
    const { rows: [m] } = await pool.query(
      `INSERT INTO music_library
         (church_id,title,artist,genre,key_note,bpm,file_url,sheet_url,lyrics,duration_seconds,tags,added_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [req.churchId, title, artist, genre, key_note, bpm || null,
       file_url, sheet_url, lyrics, duration_seconds || null, tags || [], req.user.id]
    );
    res.status(201).json({ music: m });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/choir/music/:id
router.delete('/music/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM music_library WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/choir/dues
router.get('/dues', authenticate, requireAdmin, requireSameChurch, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT cd.*, m.first_name, m.last_name, m.member_code
       FROM choir_dues cd JOIN members m ON m.id=cd.member_id
       WHERE cd.church_id=$1 ORDER BY cd.created_at DESC`,
      [req.churchId]
    );
    res.json({ dues: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/choir/dues
router.post('/dues', authenticate, requireAdmin, requireSameChurch, async (req, res) => {
  try {
    const { choir_member_id, member_id, amount, currency='GHS', period, due_date, paid=false, payment_method='cash', payment_ref, notes } = req.body;
    if (!choir_member_id || !member_id || !amount || !period)
      return res.status(400).json({ error: 'choir_member_id, member_id, amount and period required' });
    const { rows: [d] } = await pool.query(
      `INSERT INTO choir_dues (church_id,choir_member_id,member_id,amount,currency,period,due_date,paid,payment_method,payment_ref,notes,recorded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [req.churchId, choir_member_id, member_id, parseFloat(amount), currency, period,
       due_date||null, paid, payment_method, payment_ref||null, notes||null, req.user.id]
    );
    res.status(201).json({ due: d });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/choir/:id/approve
router.post('/:id/approve', authenticate, requireAdmin, async (req, res) => {
  try {
    await pool.query(
      `UPDATE choir_members SET approval_status='approved', approved_at=NOW(), approved_by=$1 WHERE id=$2`,
      [req.user.id, req.params.id]
    );
    await pool.query(
      `UPDATE members SET membership_status='choir_member'
       WHERE id=(SELECT member_id FROM choir_members WHERE id=$1)`,
      [req.params.id]
    );
    await pool.query(
      `UPDATE users SET role='choir_member'
       WHERE id=(
         SELECT u.id FROM users u
         JOIN members m ON m.user_id=u.id
         JOIN choir_members cm ON cm.member_id=m.id
         WHERE cm.id=$1
       )`,
      [req.params.id]
    );
    res.json({ message: 'Choir member approved' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/choir/:id
router.patch('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const allowed = ['voice_group','choir_role','experience_level',
                     'instruments','choir_activities','main_role','notes','is_active'];
    const updates = []; const vals = []; let i = 1;
    allowed.forEach((f) => {
      if (req.body[f] !== undefined) { updates.push(`${f}=$${i++}`); vals.push(req.body[f]); }
    });
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
    vals.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE choir_members SET ${updates.join(',')} WHERE id=$${i} RETURNING *`, vals
    );
    res.json({ choir_member: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
