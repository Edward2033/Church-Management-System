const router = require('express').Router();
const pool   = require('../lib/db');
const { authenticate, requireAdmin, requireSameChurch } = require('../middleware/auth');

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
    // Return as flat object for easy consumption
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

// PUT /api/cms/settings  — admin bulk upsert
router.put('/settings', authenticate, requireAdmin, requireSameChurch, async (req, res) => {
  try {
    const { settings } = req.body; // { key: value, ... }
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

// ══════════════════════════════════════════════════════════════
// HERO SLIDES
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

router.post('/hero-slides', authenticate, requireAdmin, requireSameChurch, async (req, res) => {
  try {
    const { title, subtitle, image_url, cta_label, cta_url, sort_order = 0, is_active = true } = req.body;
    if (!image_url) return res.status(400).json({ error: 'image_url required' });
    const { rows: [s] } = await pool.query(
      `INSERT INTO cms_hero_slides (church_id,title,subtitle,image_url,cta_label,cta_url,sort_order,is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.churchId, title, subtitle, image_url, cta_label, cta_url, sort_order, is_active]
    );
    res.status(201).json({ slide: s });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/hero-slides/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, subtitle, image_url, cta_label, cta_url, sort_order, is_active } = req.body;
    const { rows: [s] } = await pool.query(
      `UPDATE cms_hero_slides SET title=$1,subtitle=$2,image_url=$3,cta_label=$4,cta_url=$5,
       sort_order=$6,is_active=$7,updated_at=NOW() WHERE id=$8 RETURNING *`,
      [title, subtitle, image_url, cta_label, cta_url, sort_order, is_active, req.params.id]
    );
    if (!s) return res.status(404).json({ error: 'Slide not found' });
    res.json({ slide: s });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/hero-slides/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM cms_hero_slides WHERE id=$1', [req.params.id]);
    res.json({ message: 'Slide deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ══════════════════════════════════════════════════════════════
// CMS PAGES
// ══════════════════════════════════════════════════════════════

// GET /api/cms/pages/:slug  — public
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

// GET /api/cms/pages  — admin: list all pages
router.get('/pages', authenticate, requireAdmin, requireSameChurch, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, slug, title, is_published, updated_at FROM cms_pages WHERE church_id=$1 ORDER BY slug`,
      [req.churchId]
    );
    res.json({ pages: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/cms/pages/:slug  — admin upsert page content
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
