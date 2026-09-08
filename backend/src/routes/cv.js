const router = require('express').Router();
const pool   = require('../lib/db');
const { authenticate, requireAdmin } = require('../middleware/auth');
const multer = require('multer');
const { uploadToCloudinary } = require('../lib/cloudinary');

const upload = multer({ storage: multer.memoryStorage() });

// ALL routes require admin — CV Builder is admin-only
// POST /api/cv/upload-photo must come BEFORE /:id to avoid route conflict
router.post('/upload-photo', authenticate, requireAdmin, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = await uploadToCloudinary(req.file.buffer, 'cv-photos');
    res.json({ url });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/cv — list all CVs (admin sees all)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM cv_documents ORDER BY updated_at DESC`
    );
    res.json({ cvs: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/cv/:id
router.get('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { rows: [cv] } = await pool.query(
      `SELECT * FROM cv_documents WHERE id = $1`,
      [req.params.id]
    );
    if (!cv) return res.status(404).json({ error: 'CV not found' });
    res.json({ cv });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/cv — create new CV
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const {
      title, full_name, professional_title, email, phone, location,
      website, linkedin, photo_url, summary,
      work_experience, education, skills, certifications, projects, cv_references, template,
    } = req.body;

    const { rows: [cv] } = await pool.query(
      `INSERT INTO cv_documents
        (user_id, title, full_name, professional_title, email, phone, location,
         website, linkedin, photo_url, summary,
         work_experience, education, skills, certifications, projects, cv_references, template)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       RETURNING *`,
      [
        req.user.id,
        title || 'My CV',
        full_name || null, professional_title || null, email || null, phone || null,
        location || null, website || null, linkedin || null, photo_url || null, summary || null,
        JSON.stringify(work_experience || []),
        JSON.stringify(education || []),
        JSON.stringify(skills || { technical: [], soft: [], languages: [] }),
        JSON.stringify(certifications || []),
        JSON.stringify(projects || []),
        JSON.stringify(cv_references || []),
        template || 'classic',
      ]
    );
    res.status(201).json({ cv });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/cv/:id — update CV
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { rows: [existing] } = await pool.query(
      `SELECT id FROM cv_documents WHERE id = $1`,
      [req.params.id]
    );
    if (!existing) return res.status(404).json({ error: 'CV not found' });

    const {
      title, full_name, professional_title, email, phone, location,
      website, linkedin, photo_url, summary,
      work_experience, education, skills, certifications, projects, cv_references, template,
    } = req.body;

    const { rows: [cv] } = await pool.query(
      `UPDATE cv_documents SET
        title = COALESCE($1, title),
        full_name = COALESCE($2, full_name),
        professional_title = COALESCE($3, professional_title),
        email = COALESCE($4, email),
        phone = COALESCE($5, phone),
        location = COALESCE($6, location),
        website = COALESCE($7, website),
        linkedin = COALESCE($8, linkedin),
        photo_url = COALESCE($9, photo_url),
        summary = COALESCE($10, summary),
        work_experience = COALESCE($11, work_experience),
        education = COALESCE($12, education),
        skills = COALESCE($13, skills),
        certifications = COALESCE($14, certifications),
        projects = COALESCE($15, projects),
        cv_references = COALESCE($16, cv_references),
        template = COALESCE($17, template),
        updated_at = NOW()
       WHERE id = $18
       RETURNING *`,
      [
        title, full_name, professional_title, email, phone, location,
        website, linkedin, photo_url, summary,
        work_experience ? JSON.stringify(work_experience) : null,
        education ? JSON.stringify(education) : null,
        skills ? JSON.stringify(skills) : null,
        certifications ? JSON.stringify(certifications) : null,
        projects ? JSON.stringify(projects) : null,
        cv_references ? JSON.stringify(cv_references) : null,
        template,
        req.params.id,
      ]
    );
    res.json({ cv });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/cv/:id
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await pool.query(`DELETE FROM cv_documents WHERE id = $1`, [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
