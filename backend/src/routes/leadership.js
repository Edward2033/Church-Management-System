/**
 * /api/leadership  — Public read, admin write
 */
const router = require('express').Router();
const pool   = require('../lib/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

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

// POST /api/leadership — admin
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, title, bio, photo_url, email, phone, sort_order = 0 } = req.body;
    if (!name || !title) return res.status(400).json({ error: 'name and title required' });
    const { rows: [l] } = await pool.query(
      `INSERT INTO leadership (church_id,name,title,bio,photo_url,email,phone,sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user.church_id, name, title, bio, photo_url, email, phone, sort_order]
    );
    res.status(201).json({ leader: l });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/leadership/:id — admin
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, title, bio, photo_url, email, phone, sort_order, is_active } = req.body;
    const { rows: [l] } = await pool.query(
      `UPDATE leadership SET name=COALESCE($1,name), title=COALESCE($2,title),
       bio=COALESCE($3,bio), photo_url=COALESCE($4,photo_url),
       email=COALESCE($5,email), phone=COALESCE($6,phone),
       sort_order=COALESCE($7,sort_order), is_active=COALESCE($8,is_active),
       updated_at=NOW() WHERE id=$9 RETURNING *`,
      [name, title, bio, photo_url, email, phone, sort_order, is_active, req.params.id]
    );
    if (!l) return res.status(404).json({ error: 'Leader not found' });
    res.json({ leader: l });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/leadership/:id — admin
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM leadership WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
