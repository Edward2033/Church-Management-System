/**
 * /api/leadership  — Public read, admin write
 */
const router = require('express').Router();
const pool   = require('../lib/db');
const multer = require('multer');
const { uploadToCloudinary, deleteImage } = require('../lib/cloudinary');
const { authenticate, requireAdmin } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });
const CID = () => process.env.DEFAULT_CHURCH_ID;

// GET  /api/leadership  — public
router.get('/', async (req, res) => {
  try {
    const cid = req.query.church_id || CID();
    const { rows } = await pool.query(
      `SELECT * FROM leadership WHERE church_id=$1 AND is_active=TRUE ORDER BY sort_order ASC, name ASC`,
      [cid]
    );
    res.json({ leadership: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/leadership — admin (multipart/form-data with optional photo upload)
router.post('/', authenticate, requireAdmin, upload.single('photo'), async (req, res) => {
  try {
    console.log('[leadership POST] body:', req.body, '| file:', req.file?.originalname);
    const { name, title, bio, email, phone, sort_order = 0 } = req.body;
    const trimmedName  = (name  || '').trim();
    const trimmedTitle = (title || '').trim();
    if (!trimmedName || !trimmedTitle)
      return res.status(400).json({
        error: 'name and title required',
        received: { name, title },
        bodyKeys: Object.keys(req.body),
        contentType: req.headers['content-type'],
      });

    const churchId = req.user.church_id || req.churchId || process.env.DEFAULT_CHURCH_ID;

    let photoUrl = req.body.photo_url || null;
    if (req.file) {
      photoUrl = await uploadToCloudinary(req.file.buffer, 'leadership');
    }

    const { rows: [l] } = await pool.query(
      `INSERT INTO leadership (church_id,name,title,bio,photo_url,email,phone,sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [churchId, trimmedName, trimmedTitle, bio || null, photoUrl, email || null, phone || null, parseInt(sort_order)]
    );
    res.status(201).json({ leader: l });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/leadership/:id — admin (multipart/form-data with optional photo upload)
router.put('/:id', authenticate, requireAdmin, upload.single('photo'), async (req, res) => {
  try {
    const { name, title, bio, email, phone, sort_order, is_active } = req.body;

    // Get existing record to handle photo replacement
    const { rows: [existing] } = await pool.query(
      'SELECT photo_url FROM leadership WHERE id=$1', [req.params.id]
    );
    if (!existing) return res.status(404).json({ error: 'Leader not found' });

    let photoUrl = existing.photo_url;
    if (req.file) {
      if (existing.photo_url) await deleteImage(existing.photo_url);
      photoUrl = await uploadToCloudinary(req.file.buffer, 'leadership');
    }

    const { rows: [l] } = await pool.query(
      `UPDATE leadership SET name=COALESCE($1,name), title=COALESCE($2,title),
       bio=COALESCE($3,bio), photo_url=$4,
       email=COALESCE($5,email), phone=COALESCE($6,phone),
       sort_order=COALESCE($7,sort_order), is_active=COALESCE($8,is_active),
       updated_at=NOW() WHERE id=$9 RETURNING *`,
      [name, title, bio, photoUrl, email, phone, sort_order ? parseInt(sort_order) : null, is_active, req.params.id]
    );
    res.json({ leader: l });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/leadership/:id — admin
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { rows: [existing] } = await pool.query('SELECT photo_url FROM leadership WHERE id=$1', [req.params.id]);
    if (existing?.photo_url) await deleteImage(existing.photo_url);
    await pool.query('DELETE FROM leadership WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
