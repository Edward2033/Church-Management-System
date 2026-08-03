const router = require('express').Router();
const pool = require('../lib/db');
const multer = require('multer');
const { uploadToCloudinary, deleteFromCloudinary } = require('../lib/cloudinary');
const { authenticate, requireAdmin } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });

// GET /api/hero - Get all hero slides (public)
router.get('/', async (req, res) => {
  try {
    const churchId = req.query.church_id || process.env.DEFAULT_CHURCH_ID;
    const { rows } = await pool.query(`
      SELECT id, title, subtitle, image_url, cta_label, cta_url, sort_order, is_active
      FROM cms_hero_slides
      WHERE church_id = $1 AND is_active = true
      ORDER BY sort_order ASC, created_at DESC
    `, [churchId]);
    
    res.json({ slides: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/hero/all - Get all slides including inactive (admin only)
router.get('/all', authenticate, requireAdmin, async (req, res) => {
  try {
    const churchId = req.churchId || process.env.DEFAULT_CHURCH_ID;
    const { rows } = await pool.query(`
      SELECT id, title, subtitle, image_url, cta_label, cta_url, 
             sort_order, is_active, created_at, updated_at
      FROM cms_hero_slides
      WHERE church_id = $1
      ORDER BY sort_order ASC, created_at DESC
    `, [churchId]);
    
    res.json({ slides: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/hero - Create new hero slide
router.post('/', authenticate, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const { title, subtitle, ctaLabel, ctaUrl, sortOrder = 0, isActive = true } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }
    
    // Upload to Cloudinary
    const imageUrl = await uploadToCloudinary(req.file.buffer, 'hero-slides');
    
    const { rows: [slide] } = await pool.query(`
      INSERT INTO cms_hero_slides (
        church_id, title, subtitle, image_url, cta_label, cta_url, sort_order, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      req.churchId, 
      title || null, 
      subtitle || null, 
      imageUrl, 
      ctaLabel || null, 
      ctaUrl || null, 
      parseInt(sortOrder), 
      isActive === 'true' || isActive === true
    ]);
    
    res.json({ success: true, slide });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/hero/:id - Update hero slide
router.put('/:id', authenticate, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtitle, ctaLabel, ctaUrl, sortOrder, isActive } = req.body;
    
    // Get existing slide
    const { rows: [existing] } = await pool.query(
      'SELECT image_url FROM cms_hero_slides WHERE id = $1 AND church_id = $2',
      [id, req.churchId]
    );
    
    if (!existing) {
      return res.status(404).json({ error: 'Hero slide not found' });
    }
    
    let imageUrl = existing.image_url;
    
    // If new image uploaded, replace old one
    if (req.file) {
      // Delete old image from Cloudinary
      if (existing.image_url) {
        await deleteFromCloudinary(existing.image_url);
      }
      // Upload new image
      imageUrl = await uploadToCloudinary(req.file.buffer, 'hero-slides');
    }
    
    const { rows: [slide] } = await pool.query(`
      UPDATE cms_hero_slides SET
        title = COALESCE($1, title),
        subtitle = COALESCE($2, subtitle),
        image_url = $3,
        cta_label = COALESCE($4, cta_label),
        cta_url = COALESCE($5, cta_url),
        sort_order = COALESCE($6, sort_order),
        is_active = COALESCE($7, is_active),
        updated_at = NOW()
      WHERE id = $8 AND church_id = $9
      RETURNING *
    `, [
      title, 
      subtitle, 
      imageUrl, 
      ctaLabel, 
      ctaUrl, 
      sortOrder ? parseInt(sortOrder) : null,
      isActive !== undefined ? (isActive === 'true' || isActive === true) : null,
      id, 
      req.churchId
    ]);
    
    res.json({ success: true, slide });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/hero/:id - Delete hero slide
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get slide to delete image from Cloudinary
    const { rows: [slide] } = await pool.query(
      'SELECT image_url FROM cms_hero_slides WHERE id = $1 AND church_id = $2',
      [id, req.churchId]
    );
    
    if (!slide) {
      return res.status(404).json({ error: 'Hero slide not found' });
    }
    
    // Delete from database
    await pool.query(
      'DELETE FROM cms_hero_slides WHERE id = $1 AND church_id = $2',
      [id, req.churchId]
    );
    
    // Delete image from Cloudinary
    if (slide.image_url) {
      await deleteFromCloudinary(slide.image_url);
    }
    
    res.json({ success: true, message: 'Hero slide deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/hero/:id/toggle - Toggle slide active status
router.patch('/:id/toggle', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { rows: [slide] } = await pool.query(`
      UPDATE cms_hero_slides 
      SET is_active = NOT is_active, updated_at = NOW()
      WHERE id = $1 AND church_id = $2
      RETURNING *
    `, [id, req.churchId]);
    
    if (!slide) {
      return res.status(404).json({ error: 'Hero slide not found' });
    }
    
    res.json({ success: true, slide });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/hero/reorder - Reorder slides
router.patch('/reorder', authenticate, requireAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    const { slideIds } = req.body; // Array of slide IDs in new order
    
    if (!Array.isArray(slideIds)) {
      return res.status(400).json({ error: 'slideIds array required' });
    }
    
    await client.query('BEGIN');
    
    // Update sort order for each slide
    for (let i = 0; i < slideIds.length; i++) {
      await client.query(
        'UPDATE cms_hero_slides SET sort_order = $1 WHERE id = $2 AND church_id = $3',
        [i, slideIds[i], req.churchId]
      );
    }
    
    await client.query('COMMIT');
    
    res.json({ success: true, message: 'Slides reordered' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
