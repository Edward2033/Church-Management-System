const router = require('express').Router();
const pool = require('../lib/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

// ══════════════════════════════════════════════════════════════
// DAILY VERSES - Public & Member Endpoints
// ══════════════════════════════════════════════════════════════

// GET /api/verses/daily - Get today's verse (public)
router.get('/daily', async (req, res) => {
  try {
    const churchId = req.query.church_id || process.env.DEFAULT_CHURCH_ID;
    
    const { rows } = await pool.query(
      `SELECT id, verse_text, reference, book, chapter, verse_number, encouragement, date
       FROM daily_verses
       WHERE church_id = $1 AND date = CURRENT_DATE AND is_active = TRUE
       LIMIT 1`,
      [churchId]
    );
    
    if (rows.length === 0) {
      // Fallback to most recent verse
      const { rows: fallback } = await pool.query(
        `SELECT id, verse_text, reference, book, chapter, verse_number, encouragement, date
         FROM daily_verses
         WHERE church_id = $1 AND is_active = TRUE
         ORDER BY date DESC
         LIMIT 1`,
        [churchId]
      );
      
      return res.json({ verse: fallback[0] || null });
    }
    
    res.json({ verse: rows[0] });
  } catch (err) {
    console.error('[GET /verses/daily]', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/verses/prayer - Get today's prayer verse (public)
router.get('/prayer', async (req, res) => {
  try {
    const churchId = req.query.church_id || process.env.DEFAULT_CHURCH_ID;
    
    const { rows } = await pool.query(
      `SELECT id, verse_text, reference, book, chapter, verse_number, 
              explanation, prayer_text, date
       FROM prayer_verses
       WHERE church_id = $1 AND date = CURRENT_DATE AND is_active = TRUE
       LIMIT 1`,
      [churchId]
    );
    
    if (rows.length === 0) {
      // Fallback to most recent prayer verse
      const { rows: fallback } = await pool.query(
        `SELECT id, verse_text, reference, book, chapter, verse_number,
                explanation, prayer_text, date
         FROM prayer_verses
         WHERE church_id = $1 AND is_active = TRUE
         ORDER BY date DESC
         LIMIT 1`,
        [churchId]
      );
      
      return res.json({ verse: fallback[0] || null });
    }
    
    res.json({ verse: rows[0] });
  } catch (err) {
    console.error('[GET /verses/prayer]', err);
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// ADMIN - Manage Verses
// ══════════════════════════════════════════════════════════════

// GET /api/verses/daily/all - Get all daily verses (admin)
router.get('/daily/all', authenticate, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const { rows } = await pool.query(
      `SELECT * FROM daily_verses 
       WHERE church_id = $1 
       ORDER BY date DESC 
       LIMIT $2 OFFSET $3`,
      [req.churchId, parseInt(limit), offset]
    );
    
    const { rows: [count] } = await pool.query(
      `SELECT COUNT(*) as total FROM daily_verses WHERE church_id = $1`,
      [req.churchId]
    );
    
    res.json({
      verses: rows,
      total: parseInt(count.total),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/verses/daily - Create daily verse (admin)
router.post('/daily', authenticate, requireAdmin, async (req, res) => {
  try {
    const { verse_text, reference, book, chapter, verse_number, encouragement, date } = req.body;
    
    if (!verse_text || !reference) {
      return res.status(400).json({ error: 'verse_text and reference are required' });
    }
    
    const verseDate = date || new Date().toISOString().split('T')[0];
    
    const { rows: [verse] } = await pool.query(
      `INSERT INTO daily_verses 
        (church_id, verse_text, reference, book, chapter, verse_number, encouragement, date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (church_id, date) 
       DO UPDATE SET 
         verse_text = EXCLUDED.verse_text,
         reference = EXCLUDED.reference,
         book = EXCLUDED.book,
         chapter = EXCLUDED.chapter,
         verse_number = EXCLUDED.verse_number,
         encouragement = EXCLUDED.encouragement
       RETURNING *`,
      [req.churchId, verse_text, reference, book || null, chapter || null, 
       verse_number || null, encouragement || null, verseDate, req.user.id]
    );
    
    res.status(201).json({ verse });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/verses/daily/:id - Update daily verse (admin)
router.put('/daily/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { verse_text, reference, book, chapter, verse_number, encouragement, date, is_active } = req.body;
    
    const { rows: [verse] } = await pool.query(
      `UPDATE daily_verses 
       SET verse_text = COALESCE($1, verse_text),
           reference = COALESCE($2, reference),
           book = COALESCE($3, book),
           chapter = COALESCE($4, chapter),
           verse_number = COALESCE($5, verse_number),
           encouragement = COALESCE($6, encouragement),
           date = COALESCE($7, date),
           is_active = COALESCE($8, is_active)
       WHERE id = $9 AND church_id = $10
       RETURNING *`,
      [verse_text, reference, book, chapter, verse_number, encouragement, date, is_active, req.params.id, req.churchId]
    );
    
    if (!verse) {
      return res.status(404).json({ error: 'Verse not found' });
    }
    
    res.json({ verse });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/verses/daily/:id - Delete daily verse (admin)
router.delete('/daily/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM daily_verses WHERE id = $1 AND church_id = $2 RETURNING id',
      [req.params.id, req.churchId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Verse not found' });
    }
    
    res.json({ message: 'Verse deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// PRAYER VERSES - Admin
// ══════════════════════════════════════════════════════════════

// GET /api/verses/prayer/all - Get all prayer verses (admin)
router.get('/prayer/all', authenticate, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const { rows } = await pool.query(
      `SELECT * FROM prayer_verses 
       WHERE church_id = $1 
       ORDER BY date DESC 
       LIMIT $2 OFFSET $3`,
      [req.churchId, parseInt(limit), offset]
    );
    
    const { rows: [count] } = await pool.query(
      `SELECT COUNT(*) as total FROM prayer_verses WHERE church_id = $1`,
      [req.churchId]
    );
    
    res.json({
      verses: rows,
      total: parseInt(count.total),
      page: parseInt(page),
      limit: parseInt(limit)
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/verses/prayer - Create prayer verse (admin)
router.post('/prayer', authenticate, requireAdmin, async (req, res) => {
  try {
    const { verse_text, reference, book, chapter, verse_number, explanation, prayer_text, date } = req.body;
    
    if (!verse_text || !reference || !prayer_text) {
      return res.status(400).json({ error: 'verse_text, reference, and prayer_text are required' });
    }
    
    const verseDate = date || new Date().toISOString().split('T')[0];
    
    const { rows: [verse] } = await pool.query(
      `INSERT INTO prayer_verses 
        (church_id, verse_text, reference, book, chapter, verse_number, explanation, prayer_text, date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (church_id, date) 
       DO UPDATE SET 
         verse_text = EXCLUDED.verse_text,
         reference = EXCLUDED.reference,
         book = EXCLUDED.book,
         chapter = EXCLUDED.chapter,
         verse_number = EXCLUDED.verse_number,
         explanation = EXCLUDED.explanation,
         prayer_text = EXCLUDED.prayer_text
       RETURNING *`,
      [req.churchId, verse_text, reference, book || null, chapter || null, 
       verse_number || null, explanation || null, prayer_text, verseDate, req.user.id]
    );
    
    res.status(201).json({ verse });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/verses/prayer/:id - Update prayer verse (admin)
router.put('/prayer/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { verse_text, reference, book, chapter, verse_number, explanation, prayer_text, date, is_active } = req.body;
    
    const { rows: [verse] } = await pool.query(
      `UPDATE prayer_verses 
       SET verse_text = COALESCE($1, verse_text),
           reference = COALESCE($2, reference),
           book = COALESCE($3, book),
           chapter = COALESCE($4, chapter),
           verse_number = COALESCE($5, verse_number),
           explanation = COALESCE($6, explanation),
           prayer_text = COALESCE($7, prayer_text),
           date = COALESCE($8, date),
           is_active = COALESCE($9, is_active)
       WHERE id = $10 AND church_id = $11
       RETURNING *`,
      [verse_text, reference, book, chapter, verse_number, explanation, prayer_text, date, is_active, req.params.id, req.churchId]
    );
    
    if (!verse) {
      return res.status(404).json({ error: 'Verse not found' });
    }
    
    res.json({ verse });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/verses/prayer/:id - Delete prayer verse (admin)
router.delete('/prayer/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM prayer_verses WHERE id = $1 AND church_id = $2 RETURNING id',
      [req.params.id, req.churchId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Verse not found' });
    }
    
    res.json({ message: 'Verse deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
