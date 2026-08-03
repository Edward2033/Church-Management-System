const router = require('express').Router();
const pool   = require('../lib/db');
const multer = require('multer');
const { uploadToCloudinary, deleteImage } = require('../lib/cloudinary');
const { authenticate, requireAdmin, requireSameChurch } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });
const DEFAULT_CID = () => process.env.DEFAULT_CHURCH_ID;

// ══════════════════════════════════════════════════════════════
// SETTINGS (key/value store)
// ══════════════════════════════════════════════════════════════

// GET /api/cms/settings  — public, returns all or by group
router.get('/settings', async (req, res) => {
  try {
    const cid = req.query.church_id || DEFAULT_CID();
    const { group } = req.query;
    let q = `SELECT key, value, type, group_name FROM cms_settings WHERE church_id=$1`;
    const params = [cid]; let idx = 2;
    if (group) { q += ` AND group_name=$${idx++}`; params.push(group); }
    q += ' ORDER BY group_name, key';
    const { rows } = await pool.query(q, params);
    const settings = {};
    rows.forEach((r) => {
      settings[r.key] = r.type === 'boolean' ? r.value === 'true'
        : r.type === 'number' ? parseFloat(r.value)
        : r.type === 'json' ? (() => { try { return JSON.parse(r.value); } catch { return r.value; } })()
        : r.value;
    });
    res.json({ settings, raw: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/cms/settings  — admin bulk upsert (JSON body)
router.put('/settings', authenticate, requireAdmin, requireSameChurch, async (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object')
      return res.status(400).json({ error: 'settings object required' });
    const entries = Object.entries(settings);
    if (!entries.length) return res.status(400).json({ error: 'No settings provided' });
    for (const [key, value] of entries) {
      await pool.query(
        `INSERT INTO cms_settings (church_id, key, value, updated_by, updated_at)
         VALUES ($1,$2,$3,$4,NOW())
         ON CONFLICT (church_id, key)
         DO UPDATE SET value=EXCLUDED.value, updated_by=EXCLUDED.updated_by, updated_at=NOW()`,
        [req.churchId, key, String(value), req.user.id]
      );
    }
    res.json({ message: `${entries.length} setting(s) updated` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/cms/settings/upload  — admin upload image, saves URL to a settings key
router.post('/settings/upload', authenticate, requireAdmin, requireSameChurch,
  upload.single('image'), async (req, res) => {
    try {
      const { key, folder = 'cms' } = req.body;
      if (!key) return res.status(400).json({ error: 'key required' });
      if (!req.file) return res.status(400).json({ error: 'image file required' });

      // Delete old image if exists
      const { rows: [existing] } = await pool.query(
        `SELECT value FROM cms_settings WHERE church_id=$1 AND key=$2`,
        [req.churchId, key]
      );
      if (existing?.value) await deleteImage(existing.value).catch(() => {});

      const imageUrl = await uploadToCloudinary(req.file.buffer, folder);

      await pool.query(
        `INSERT INTO cms_settings (church_id, key, value, type, group_name, updated_by, updated_at)
         VALUES ($1,$2,$3,'url',$4,$5,NOW())
         ON CONFLICT (church_id, key)
         DO UPDATE SET value=EXCLUDED.value, updated_by=EXCLUDED.updated_by, updated_at=NOW()`,
        [req.churchId, key, imageUrl, req.body.group || 'about', req.user.id]
      );
      res.json({ url: imageUrl });
    } catch (err) { res.status(500).json({ error: err.message }); }
  }
);

// ══════════════════════════════════════════════════════════════
// ABOUT VALUES (Core Values rows)
// ══════════════════════════════════════════════════════════════

router.get('/about-values', async (req, res) => {
  try {
    const cid = req.query.church_id || DEFAULT_CID();
    const { rows } = await pool.query(
      `SELECT * FROM about_values WHERE church_id=$1 AND is_active=TRUE ORDER BY sort_order ASC, created_at ASC`,
      [cid]
    );
    res.json({ values: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/about-values/all', authenticate, requireAdmin, requireSameChurch, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM about_values WHERE church_id=$1 ORDER BY sort_order ASC`,
      [req.churchId]
    );
    res.json({ values: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/about-values', authenticate, requireAdmin, requireSameChurch, async (req, res) => {
  try {
    const { title, description, color_class, sort_order = 0 } = req.body;
    if (!title || !description) return res.status(400).json({ error: 'title and description required' });
    const { rows: [v] } = await pool.query(
      `INSERT INTO about_values (church_id, title, description, color_class, sort_order)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.churchId, title, description, color_class || 'from-brand-600/30 to-brand-500/10 border-brand-500/30 text-brand-400', parseInt(sort_order)]
    );
    res.status(201).json({ value: v });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/about-values/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, description, color_class, sort_order, is_active } = req.body;
    const { rows: [v] } = await pool.query(
      `UPDATE about_values SET
         title=COALESCE($1,title), description=COALESCE($2,description),
         color_class=COALESCE($3,color_class), sort_order=COALESCE($4,sort_order),
         is_active=COALESCE($5,is_active), updated_at=NOW()
       WHERE id=$6 RETURNING *`,
      [title, description, color_class, sort_order != null ? parseInt(sort_order) : null, is_active, req.params.id]
    );
    if (!v) return res.status(404).json({ error: 'Not found' });
    res.json({ value: v });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/about-values/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM about_values WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ══════════════════════════════════════════════════════════════
// HOMEPAGE STATS
// ══════════════════════════════════════════════════════════════

router.get('/homepage-stats', async (req, res) => {
  try {
    const cid = req.query.church_id || DEFAULT_CID();
    const { rows } = await pool.query(
      `SELECT * FROM homepage_stats WHERE church_id=$1 AND is_active=TRUE ORDER BY sort_order ASC`,
      [cid]
    );
    res.json({ stats: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/homepage-stats/all', authenticate, requireAdmin, requireSameChurch, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM homepage_stats WHERE church_id=$1 ORDER BY sort_order ASC`,
      [req.churchId]
    );
    res.json({ stats: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/homepage-stats', authenticate, requireAdmin, requireSameChurch, async (req, res) => {
  try {
    const { value, label, icon = 'users', sort_order = 0 } = req.body;
    if (!value || !label) return res.status(400).json({ error: 'value and label required' });
    const { rows: [s] } = await pool.query(
      `INSERT INTO homepage_stats (church_id, value, label, icon, sort_order) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.churchId, value, label, icon, parseInt(sort_order)]
    );
    res.status(201).json({ stat: s });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/homepage-stats/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { value, label, icon, sort_order, is_active } = req.body;
    const { rows: [s] } = await pool.query(
      `UPDATE homepage_stats SET
         value=COALESCE($1,value), label=COALESCE($2,label), icon=COALESCE($3,icon),
         sort_order=COALESCE($4,sort_order), is_active=COALESCE($5,is_active), updated_at=NOW()
       WHERE id=$6 RETURNING *`,
      [value, label, icon, sort_order != null ? parseInt(sort_order) : null, is_active, req.params.id]
    );
    if (!s) return res.status(404).json({ error: 'Not found' });
    res.json({ stat: s });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/homepage-stats/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM homepage_stats WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ══════════════════════════════════════════════════════════════
// HOMEPAGE FEATURES
// ══════════════════════════════════════════════════════════════

router.get('/homepage-features', async (req, res) => {
  try {
    const cid = req.query.church_id || DEFAULT_CID();
    const { rows } = await pool.query(
      `SELECT * FROM homepage_features WHERE church_id=$1 AND is_active=TRUE ORDER BY sort_order ASC`,
      [cid]
    );
    res.json({ features: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/homepage-features/all', authenticate, requireAdmin, requireSameChurch, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM homepage_features WHERE church_id=$1 ORDER BY sort_order ASC`,
      [req.churchId]
    );
    res.json({ features: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/homepage-features', authenticate, requireAdmin, requireSameChurch, async (req, res) => {
  try {
    const { icon = 'heart', title, description, sort_order = 0 } = req.body;
    if (!title || !description) return res.status(400).json({ error: 'title and description required' });
    const { rows: [f] } = await pool.query(
      `INSERT INTO homepage_features (church_id, icon, title, description, sort_order) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.churchId, icon, title, description, parseInt(sort_order)]
    );
    res.status(201).json({ feature: f });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/homepage-features/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { icon, title, description, sort_order, is_active } = req.body;
    const { rows: [f] } = await pool.query(
      `UPDATE homepage_features SET
         icon=COALESCE($1,icon), title=COALESCE($2,title), description=COALESCE($3,description),
         sort_order=COALESCE($4,sort_order), is_active=COALESCE($5,is_active), updated_at=NOW()
       WHERE id=$6 RETURNING *`,
      [icon, title, description, sort_order != null ? parseInt(sort_order) : null, is_active, req.params.id]
    );
    if (!f) return res.status(404).json({ error: 'Not found' });
    res.json({ feature: f });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/homepage-features/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM homepage_features WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ══════════════════════════════════════════════════════════════
// HOMEPAGE SERVICE TIMES
// ══════════════════════════════════════════════════════════════

router.get('/homepage-services', async (req, res) => {
  try {
    const cid = req.query.church_id || DEFAULT_CID();
    const { rows } = await pool.query(
      `SELECT * FROM homepage_service_times WHERE church_id=$1 AND is_active=TRUE ORDER BY sort_order ASC`,
      [cid]
    );
    res.json({ services: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/homepage-services/all', authenticate, requireAdmin, requireSameChurch, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM homepage_service_times WHERE church_id=$1 ORDER BY sort_order ASC`,
      [req.churchId]
    );
    res.json({ services: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/homepage-services', authenticate, requireAdmin, requireSameChurch, async (req, res) => {
  try {
    const { day, name, times = [], description, icon = 'calendar', sort_order = 0 } = req.body;
    if (!day || !name) return res.status(400).json({ error: 'day and name required' });
    const timesArr = Array.isArray(times) ? times : times.split('\n').map((t) => t.trim()).filter(Boolean);
    const { rows: [s] } = await pool.query(
      `INSERT INTO homepage_service_times (church_id, day, name, times, description, icon, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.churchId, day, name, timesArr, description || null, icon, parseInt(sort_order)]
    );
    res.status(201).json({ service: s });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/homepage-services/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { day, name, times, description, icon, sort_order, is_active } = req.body;
    let timesArr = undefined;
    if (times !== undefined) {
      timesArr = Array.isArray(times) ? times : times.split('\n').map((t) => t.trim()).filter(Boolean);
    }
    const { rows: [s] } = await pool.query(
      `UPDATE homepage_service_times SET
         day=COALESCE($1,day), name=COALESCE($2,name),
         times=COALESCE($3,times), description=COALESCE($4,description),
         icon=COALESCE($5,icon), sort_order=COALESCE($6,sort_order),
         is_active=COALESCE($7,is_active), updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [day, name, timesArr, description, icon, sort_order != null ? parseInt(sort_order) : null, is_active, req.params.id]
    );
    if (!s) return res.status(404).json({ error: 'Not found' });
    res.json({ service: s });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/homepage-services/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM homepage_service_times WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ══════════════════════════════════════════════════════════════
// HERO SLIDES (legacy cms.js routes kept for compatibility)
// ══════════════════════════════════════════════════════════════

router.get('/hero-slides', async (req, res) => {
  try {
    const cid = req.query.church_id || DEFAULT_CID();
    const { rows } = await pool.query(
      `SELECT * FROM cms_hero_slides WHERE church_id=$1 AND is_active=TRUE ORDER BY sort_order ASC, created_at ASC`,
      [cid]
    );
    res.json({ slides: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/hero-slides/all', authenticate, requireAdmin, requireSameChurch, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM cms_hero_slides WHERE church_id=$1 ORDER BY sort_order ASC`,
      [req.churchId]
    );
    res.json({ slides: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ══════════════════════════════════════════════════════════════
// CMS PAGES
// ══════════════════════════════════════════════════════════════

router.get('/pages/:slug', async (req, res) => {
  try {
    const cid = req.query.church_id || DEFAULT_CID();
    const { rows } = await pool.query(
      `SELECT * FROM cms_pages WHERE church_id=$1 AND slug=$2 AND is_published=TRUE`,
      [cid, req.params.slug]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Page not found' });
    res.json({ page: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/pages', authenticate, requireAdmin, requireSameChurch, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, slug, title, is_published, updated_at FROM cms_pages WHERE church_id=$1 ORDER BY slug`,
      [req.churchId]
    );
    res.json({ pages: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/pages/:slug', authenticate, requireAdmin, requireSameChurch, async (req, res) => {
  try {
    const { title, content, is_published = true } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });
    const { rows: [p] } = await pool.query(
      `INSERT INTO cms_pages (church_id,slug,title,content,is_published,updated_by)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (church_id,slug)
       DO UPDATE SET title=EXCLUDED.title, content=EXCLUDED.content,
         is_published=EXCLUDED.is_published, updated_by=EXCLUDED.updated_by, updated_at=NOW()
       RETURNING *`,
      [req.churchId, req.params.slug, title, content || {}, is_published, req.user.id]
    );
    res.json({ page: p });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
