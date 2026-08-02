const router = require('express').Router();
const pool   = require('../lib/db');
const multer = require('multer');
const { uploadToCloudinary, deleteFromCloudinary } = require('../lib/cloudinary');
const { authenticate, requireAdmin, requireLeader, requireSameChurch } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });
const CID = (req) => req.churchId || req.user?.church_id || process.env.DEFAULT_CHURCH_ID;

// ══════════════════════════════════════════════════════════════
// DEPARTMENTS
// ══════════════════════════════════════════════════════════════
router.get('/departments', async (req, res) => {
  try {
    const cid = req.query.church_id || process.env.DEFAULT_CHURCH_ID;
    const { rows } = await pool.query(
      `SELECT d.*, m.first_name||' '||m.last_name AS leader_name
       FROM departments d LEFT JOIN members m ON m.id=d.leader_id
       WHERE d.church_id=$1 AND d.is_active=TRUE ORDER BY d.name`,
      [cid]
    );
    res.json({ departments: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/departments', authenticate, requireAdmin, requireSameChurch, async (req, res) => {
  try {
    const { name, description, leader_id } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const { rows: [d] } = await pool.query(
      `INSERT INTO departments (church_id,name,description,leader_id) VALUES ($1,$2,$3,$4) RETURNING *`,
      [CID(req), name, description, leader_id||null]
    );
    res.status(201).json({ department: d });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/departments/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, description, leader_id, is_active } = req.body;
    const { rows: [d] } = await pool.query(
      `UPDATE departments SET name=COALESCE($1,name), description=COALESCE($2,description),
       leader_id=COALESCE($3,leader_id), is_active=COALESCE($4,is_active), updated_at=NOW()
       WHERE id=$5 RETURNING *`,
      [name, description, leader_id, is_active, req.params.id]
    );
    res.json({ department: d });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/departments/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await pool.query(`UPDATE departments SET is_active=FALSE WHERE id=$1`, [req.params.id]);
    res.json({ message: 'Department deactivated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ══════════════════════════════════════════════════════════════
// ANNOUNCEMENTS
// ══════════════════════════════════════════════════════════════
router.get('/announcements', async (req, res) => {
  try {
    const cid = req.query.church_id || process.env.DEFAULT_CHURCH_ID;
    const { category, all: showAll } = req.query;
    let q = `SELECT a.*, u.email AS author_email,
               m.first_name||' '||m.last_name AS author_name
             FROM announcements a
             LEFT JOIN users u ON u.id=a.author_id
             LEFT JOIN members m ON m.user_id=a.author_id
             WHERE a.church_id=$1`;
    const params = [cid]; let idx = 2;
    if (!showAll) q += ` AND a.is_active=TRUE AND (a.expires_at IS NULL OR a.expires_at > NOW())`;
    if (category) { q += ` AND a.category=$${idx++}`; params.push(category); }
    q += ' ORDER BY a.pinned DESC, a.published_at DESC';
    const { rows } = await pool.query(q, params);
    res.json({ announcements: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/announcements', authenticate, requireAdmin, requireSameChurch, upload.single('image'), async (req, res) => {
  try {
    const { title, content, category='general', pinned=false, audience='all', expires_at } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'title and content required' });
    
    let imageUrl = null;
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.buffer, 'announcements');
    }
    
    const { rows: [a] } = await pool.query(
      `INSERT INTO announcements (church_id,title,content,category,image_url,pinned,audience,author_id,expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [CID(req), title, content, category, imageUrl, pinned, audience, req.user.id, expires_at||null]
    );
    res.status(201).json({ announcement: a });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/announcements/:id', authenticate, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const { title, content, category, pinned, is_active, audience, expires_at } = req.body;
    
    // Get existing announcement
    const { rows: [existing] } = await pool.query('SELECT image_url FROM announcements WHERE id = $1', [req.params.id]);
    let imageUrl = existing?.image_url;
    
    // Handle new image upload
    if (req.file) {
      if (existing?.image_url) {
        await deleteFromCloudinary(existing.image_url);
      }
      imageUrl = await uploadToCloudinary(req.file.buffer, 'announcements');
    }
    
    const { rows: [a] } = await pool.query(
      `UPDATE announcements SET title=$1,content=$2,category=$3,image_url=$4,pinned=$5,
       is_active=$6,audience=$7,expires_at=$8,updated_at=NOW() WHERE id=$9 RETURNING *`,
      [title, content, category, imageUrl, pinned, is_active, audience, expires_at||null, req.params.id]
    );
    res.json({ announcement: a });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/announcements/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM announcements WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ══════════════════════════════════════════════════════════════
// ACTIVITIES — alias for /events (legacy frontend compatibility)
// ══════════════════════════════════════════════════════════════
router.get('/activities', async (req, res) => {
  try {
    const cid = req.query.church_id || process.env.DEFAULT_CHURCH_ID;
    const { category } = req.query;
    let q = `SELECT * FROM events WHERE church_id=$1 AND is_active=TRUE`;
    const params = [cid]; let idx = 2;
    if (category) { q += ` AND category=$${idx++}`; params.push(category); }
    q += ' ORDER BY event_date ASC';
    const { rows } = await pool.query(q, params);
    res.json({ activities: rows, events: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/activities', authenticate, requireAdmin, requireSameChurch, upload.single('image'), async (req, res) => {
  try {
    const { title, description, category='church', event_date, start_time,
      end_time, location, audience='all' } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });
    
    let imageUrl = null;
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.buffer, 'activities');
    }
    
    const { rows: [e] } = await pool.query(
      `INSERT INTO events (church_id,title,description,category,image_url,event_date,
       start_time,end_time,location,audience,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [CID(req), title, description, category, imageUrl, event_date||null,
       start_time||null, end_time||null, location, audience, req.user.id]
    );
    res.status(201).json({ activity: e, event: e });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/activities/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await pool.query(`UPDATE events SET is_active=FALSE WHERE id=$1`, [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ══════════════════════════════════════════════════════════════
// DONATIONS — alias for /finance/transactions (legacy frontend)
// ══════════════════════════════════════════════════════════════
router.get('/donations', authenticate, requireSameChurch, async (req, res) => {
  try {
    const { type } = req.query;
    let q = `SELECT t.*,
               fc.name AS category_name,
               m.first_name||' '||m.last_name AS member_name,
               t.transaction_date AS donated_at,
               t.description AS note
             FROM finance_transactions t
             LEFT JOIN finance_categories fc ON fc.id=t.category_id
             LEFT JOIN members m ON m.id=t.member_id
             WHERE t.church_id=$1 AND t.type='income'`;
    const params = [req.churchId]; let idx = 2;
    if (type) { q += ` AND (fc.name ILIKE $${idx} OR t.sub_type=$${idx})`; params.push(`%${type}%`); idx++; }
    q += ' ORDER BY t.transaction_date DESC, t.created_at DESC';
    const { rows } = await pool.query(q, params);

    // Summary by sub_type / category
    const { rows: summary } = await pool.query(
      `SELECT COALESCE(fc.name,'Other') AS type, SUM(t.amount) AS total
       FROM finance_transactions t
       LEFT JOIN finance_categories fc ON fc.id=t.category_id
       WHERE t.church_id=$1 AND t.type='income' AND t.payment_status='completed'
       GROUP BY fc.name ORDER BY total DESC`,
      [req.churchId]
    );
    res.json({ donations: rows, summary });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/donations', authenticate, requireSameChurch, async (req, res) => {
  try {
    const { member_id, donor_name, donor_email, amount, currency='GHS',
      type='offering', payment_method='cash', payment_ref, note, category_id } = req.body;
    if (!amount) return res.status(400).json({ error: 'amount required' });
    const { rows: [rcp] } = await pool.query(`SELECT generate_receipt_number() AS rn`);
    const { rows: [t] } = await pool.query(
      `INSERT INTO finance_transactions
         (church_id,category_id,member_id,donor_name,donor_email,amount,currency,
          type,sub_type,payment_method,payment_ref,description,receipt_number,
          recorded_by,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'income',$8,$9,$10,$11,$12,$13,$13) RETURNING *`,
      [req.churchId, category_id||null, member_id||null, donor_name, donor_email,
       parseFloat(amount), currency, type, payment_method, payment_ref||null,
       note||null, rcp.rn, req.user.id]
    );
    res.status(201).json({ donation: t, transaction: t });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ══════════════════════════════════════════════════════════════
// EVENTS
// ══════════════════════════════════════════════════════════════
router.get('/events', async (req, res) => {
  try {
    const cid = req.query.church_id || process.env.DEFAULT_CHURCH_ID;
    const { category, upcoming } = req.query;
    let q = `SELECT * FROM events WHERE church_id=$1 AND is_active=TRUE`;
    const params = [cid]; let idx = 2;
    if (category)  { q += ` AND category=$${idx++}`;  params.push(category); }
    if (upcoming)  { q += ` AND event_date >= CURRENT_DATE`; }
    q += ' ORDER BY event_date ASC';
    const { rows } = await pool.query(q, params);
    res.json({ events: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/events', authenticate, requireAdmin, requireSameChurch, async (req, res) => {
  try {
    const { title, description, category='general', image_url, event_date, start_time,
      end_time, location, audience='all', capacity, requires_registration=false } = req.body;
    if (!title || !event_date) return res.status(400).json({ error: 'title and event_date required' });
    const { rows: [e] } = await pool.query(
      `INSERT INTO events (church_id,title,description,category,image_url,event_date,start_time,
       end_time,location,audience,capacity,requires_registration,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [CID(req), title, description, category, image_url, event_date, start_time||null,
       end_time||null, location, audience, capacity||null, requires_registration, req.user.id]
    );
    res.status(201).json({ event: e });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/events/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, description, category, image_url, event_date, start_time, end_time,
      location, audience, capacity, requires_registration, is_active } = req.body;
    const { rows: [e] } = await pool.query(
      `UPDATE events SET title=$1,description=$2,category=$3,image_url=$4,event_date=$5,
       start_time=$6,end_time=$7,location=$8,audience=$9,capacity=$10,
       requires_registration=$11,is_active=$12,updated_at=NOW() WHERE id=$13 RETURNING *`,
      [title, description, category, image_url, event_date, start_time, end_time,
       location, audience, capacity, requires_registration, is_active, req.params.id]
    );
    res.json({ event: e });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/events/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await pool.query(`UPDATE events SET is_active=FALSE WHERE id=$1`, [req.params.id]);
    res.json({ message: 'Event deactivated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ══════════════════════════════════════════════════════════════
// ATTENDANCE
// ══════════════════════════════════════════════════════════════
router.get('/attendance', authenticate, requireLeader, requireSameChurch, async (req, res) => {
  try {
    const { date, type, member_id } = req.query;
    let q = `SELECT a.*, m.first_name, m.last_name, m.member_code
             FROM attendance a JOIN members m ON m.id=a.member_id
             WHERE a.church_id=$1`;
    const params = [req.churchId]; let idx = 2;
    if (date)      { q += ` AND a.date=$${idx++}`;      params.push(date); }
    if (type)      { q += ` AND a.type=$${idx++}`;      params.push(type); }
    if (member_id) { q += ` AND a.member_id=$${idx++}`; params.push(member_id); }
    q += ' ORDER BY a.date DESC, m.last_name';
    const { rows } = await pool.query(q, params);
    res.json({ attendance: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/attendance', authenticate, requireLeader, requireSameChurch, async (req, res) => {
  try {
    const records = Array.isArray(req.body) ? req.body : [req.body];
    const inserted = [];
    for (const r of records) {
      const { member_id, date, type='sunday_service', status='present', check_in_method='manual', notes, event_id } = r;
      if (!member_id || !date) continue;
      const { rows: [a] } = await pool.query(
        `INSERT INTO attendance (church_id,member_id,date,type,status,check_in_method,notes,event_id,recorded_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (member_id,date,type) DO UPDATE SET status=EXCLUDED.status
         RETURNING *`,
        [req.churchId, member_id, date, type, status, check_in_method, notes||null, event_id||null, req.user.id]
      );
      inserted.push(a);
    }
    res.status(201).json({ attendance: inserted, count: inserted.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ══════════════════════════════════════════════════════════════
// GALLERY, SERMONS, TESTIMONIALS, PRAYER REQUESTS, CONTACT, DOCUMENTS, NOTIFICATIONS
// ══════════════════════════════════════════════════════════════
router.get('/gallery', async (req, res) => {
  try {
    const cid = req.query.church_id || process.env.DEFAULT_CHURCH_ID;
    const { category } = req.query;
    let q = `SELECT g.*, m.first_name||' '||m.last_name AS uploader_name
             FROM gallery g LEFT JOIN members m ON m.user_id=g.uploaded_by
             WHERE g.church_id=$1`;
    const params = [cid]; let idx = 2;
    if (category) { q += ` AND g.category=$${idx++}`; params.push(category); }
    q += ' ORDER BY g.sort_order ASC, g.created_at DESC';
    const { rows } = await pool.query(q, params);
    res.json({ gallery: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/gallery', authenticate, requireAdmin, requireSameChurch, upload.single('image'), async (req, res) => {
  try {
    const { title, category='general', caption, sort_order=0 } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }
    
    const imageUrl = await uploadToCloudinary(req.file.buffer, 'gallery');
    
    const { rows: [g] } = await pool.query(
      `INSERT INTO gallery (church_id,title,image_url,category,caption,sort_order,uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [CID(req), title, imageUrl, category, caption, sort_order, req.user.id]
    );
    res.status(201).json({ item: g });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/gallery/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    // Get image URL to delete from Cloudinary
    const { rows: [item] } = await pool.query('SELECT image_url FROM gallery WHERE id=$1', [req.params.id]);
    if (item?.image_url) {
      await deleteFromCloudinary(item.image_url);
    }
    
    await pool.query('DELETE FROM gallery WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/sermons', async (req, res) => {
  try {
    const cid = req.query.church_id || process.env.DEFAULT_CHURCH_ID;
    const { rows } = await pool.query(
      `SELECT * FROM sermons WHERE church_id=$1 AND is_published=TRUE ORDER BY sermon_date DESC`,
      [cid]
    );
    res.json({ sermons: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/sermons', authenticate, requireAdmin, requireSameChurch, async (req, res) => {
  try {
    const { title, speaker, description, scripture, audio_url, video_url, thumbnail_url,
      sermon_date, duration_minutes, series, tags=[], is_published=false } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });
    const { rows: [s] } = await pool.query(
      `INSERT INTO sermons (church_id,title,speaker,description,scripture,audio_url,video_url,
       thumbnail_url,sermon_date,duration_minutes,series,tags,is_published,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [CID(req), title, speaker, description, scripture, audio_url, video_url, thumbnail_url,
       sermon_date||null, duration_minutes||null, series, tags, is_published, req.user.id]
    );
    res.status(201).json({ sermon: s });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/sermons/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, speaker, description, scripture, audio_url, video_url, thumbnail_url,
      sermon_date, duration_minutes, series, tags, is_published } = req.body;
    const { rows: [s] } = await pool.query(
      `UPDATE sermons SET title=$1,speaker=$2,description=$3,scripture=$4,audio_url=$5,
       video_url=$6,thumbnail_url=$7,sermon_date=$8,duration_minutes=$9,series=$10,
       tags=$11,is_published=$12,updated_at=NOW() WHERE id=$13 RETURNING *`,
      [title, speaker, description, scripture, audio_url, video_url, thumbnail_url,
       sermon_date, duration_minutes, series, tags, is_published, req.params.id]
    );
    res.json({ sermon: s });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/sermons/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM sermons WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/testimonials', async (req, res) => {
  try {
    const cid = req.query.church_id || process.env.DEFAULT_CHURCH_ID;
    const { rows } = await pool.query(
      `SELECT * FROM testimonials WHERE church_id=$1 AND is_approved=TRUE ORDER BY is_featured DESC, created_at DESC`,
      [cid]
    );
    res.json({ testimonials: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/testimonials', async (req, res) => {
  try {
    const { church_id=process.env.DEFAULT_CHURCH_ID, member_id, author_name, content, photo_url } = req.body;
    if (!content) return res.status(400).json({ error: 'content required' });
    const { rows: [t] } = await pool.query(
      `INSERT INTO testimonials (church_id,member_id,author_name,content,photo_url) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [church_id, member_id||null, author_name, content, photo_url]
    );
    res.status(201).json({ testimonial: t });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/testimonials/:id/approve', authenticate, requireAdmin, async (req, res) => {
  try {
    const { is_featured=false } = req.body;
    await pool.query(`UPDATE testimonials SET is_approved=TRUE, is_featured=$1 WHERE id=$2`, [is_featured, req.params.id]);
    res.json({ message: 'Approved' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/prayer', authenticate, requireSameChurch, async (req, res) => {
  try {
    const { is_public } = req.query;
    let q = `SELECT pr.*, m.first_name, m.last_name FROM prayer_requests pr
             LEFT JOIN members m ON m.id=pr.member_id WHERE pr.church_id=$1`;
    const params = [req.churchId];
    if (is_public) q += ' AND pr.is_public=TRUE';
    else if (!['admin','superadmin','pastor'].includes(req.user.role)) {
      q += ` AND (pr.is_public=TRUE OR pr.member_id=$2)`;
      params.push(req.user.member_id);
    }
    q += ' ORDER BY pr.created_at DESC';
    const { rows } = await pool.query(q, params);
    res.json({ prayers: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/prayer', authenticate, requireSameChurch, async (req, res) => {
  try {
    const { subject, request, is_anonymous=false, is_public=false } = req.body;
    if (!request) return res.status(400).json({ error: 'request required' });
    const { rows: [p] } = await pool.query(
      `INSERT INTO prayer_requests (church_id,member_id,subject,request,is_anonymous,is_public)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.churchId, req.user.member_id||null, subject, request, is_anonymous, is_public]
    );
    res.status(201).json({ prayer: p });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/contact', async (req, res) => {
  try {
    const { church_id=process.env.DEFAULT_CHURCH_ID, name, email, phone, subject, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ error: 'name, email and message required' });
    await pool.query(
      `INSERT INTO contact_messages (church_id,name,email,phone,subject,message) VALUES ($1,$2,$3,$4,$5,$6)`,
      [church_id, name, email, phone, subject, message]
    );
    res.json({ message: 'Message sent' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/contact', authenticate, requireAdmin, requireSameChurch, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM contact_messages WHERE church_id=$1 ORDER BY created_at DESC`,
      [req.churchId]
    );
    res.json({ messages: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/contact/:id/read', authenticate, requireAdmin, async (req, res) => {
  try {
    await pool.query(`UPDATE contact_messages SET is_read=TRUE WHERE id=$1`, [req.params.id]);
    res.json({ message: 'Marked as read' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/documents', authenticate, requireSameChurch, async (req, res) => {
  try {
    const { category } = req.query;
    const isAdmin = ['admin','superadmin','pastor'].includes(req.user.role);
    let q = `SELECT * FROM documents WHERE church_id=$1`;
    const params = [req.churchId]; let idx = 2;
    if (!isAdmin) q += ' AND is_public=TRUE';
    if (category) { q += ` AND category=$${idx++}`; params.push(category); }
    q += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(q, params);
    res.json({ documents: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/documents', authenticate, requireAdmin, requireSameChurch, async (req, res) => {
  try {
    const { title, description, file_url, file_type, file_size, category='general', version='1.0', is_public=false } = req.body;
    if (!title || !file_url) return res.status(400).json({ error: 'title and file_url required' });
    const { rows: [d] } = await pool.query(
      `INSERT INTO documents (church_id,title,description,file_url,file_type,file_size,category,version,is_public,uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [req.churchId, title, description, file_url, file_type, file_size||null, category, version, is_public, req.user.id]
    );
    res.status(201).json({ document: d });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/documents/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM documents WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/notifications', authenticate, requireSameChurch, async (req, res) => {
  try {
    const role = req.user.role;
    const { rows } = await pool.query(
      `SELECT * FROM notifications
       WHERE church_id=$1 AND is_active=TRUE
         AND (audience='all' OR audience='members'
              OR (audience='choir' AND $2='choir_member')
              OR (audience IN ('leaders','admin') AND $3))
       ORDER BY created_at DESC LIMIT 50`,
      [req.churchId, role, ['admin','superadmin','pastor','elder','deacon','leader'].includes(role)]
    );
    res.json({ notifications: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/notifications/broadcast', authenticate, requireAdmin, requireSameChurch, async (req, res) => {
  try {
    const { title, message, type='system', audience='all' } = req.body;
    if (!title || !message) return res.status(400).json({ error: 'title and message required' });
    const { rows: [n] } = await pool.query(
      `INSERT INTO notifications (church_id,title,message,type,audience,sender_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.churchId, title, message, type, audience, req.user.id]
    );
    res.status(201).json({ notification: n });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/notifications/:id/read', authenticate, async (req, res) => {
  try {
    await pool.query(
      `UPDATE notifications SET read_by=array_append(read_by,$1)
       WHERE id=$2 AND NOT ($1=ANY(read_by))`,
      [req.user.id, req.params.id]
    );
    res.json({ message: 'Marked as read' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
