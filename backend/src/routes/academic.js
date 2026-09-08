const router = require('express').Router();
const pool   = require('../lib/db');
const { authenticate } = require('../middleware/auth');

// GET /api/academic — list user's documents
router.get('/', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, doc_type, title, author, institution, doc_date, created_at, updated_at
       FROM academic_documents WHERE user_id = $1 ORDER BY updated_at DESC`,
      [req.user.id]
    );
    res.json({ documents: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/academic/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { rows: [doc] } = await pool.query(
      `SELECT * FROM academic_documents WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    res.json({ document: doc });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/academic — create
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      doc_type, title, author, institution, department, course, instructor,
      doc_date, abstract, introduction, sections, methodology, results,
      discussion, conclusion, references_list,
    } = req.body;

    const { rows: [doc] } = await pool.query(
      `INSERT INTO academic_documents
        (user_id, doc_type, title, author, institution, department, course, instructor,
         doc_date, abstract, introduction, sections, methodology, results,
         discussion, conclusion, references_list)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING *`,
      [
        req.user.id,
        doc_type || 'essay', title || null, author || null, institution || null,
        department || null, course || null, instructor || null, doc_date || null,
        abstract || null, introduction || null,
        JSON.stringify(sections || []),
        methodology || null, results || null, discussion || null,
        conclusion || null, references_list || null,
      ]
    );
    res.status(201).json({ document: doc });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/academic/:id — update
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { rows: [existing] } = await pool.query(
      `SELECT id FROM academic_documents WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!existing) return res.status(404).json({ error: 'Document not found' });

    const {
      doc_type, title, author, institution, department, course, instructor,
      doc_date, abstract, introduction, sections, methodology, results,
      discussion, conclusion, references_list,
    } = req.body;

    const { rows: [doc] } = await pool.query(
      `UPDATE academic_documents SET
        doc_type = COALESCE($1, doc_type),
        title = COALESCE($2, title),
        author = COALESCE($3, author),
        institution = COALESCE($4, institution),
        department = COALESCE($5, department),
        course = COALESCE($6, course),
        instructor = COALESCE($7, instructor),
        doc_date = COALESCE($8, doc_date),
        abstract = COALESCE($9, abstract),
        introduction = COALESCE($10, introduction),
        sections = COALESCE($11, sections),
        methodology = COALESCE($12, methodology),
        results = COALESCE($13, results),
        discussion = COALESCE($14, discussion),
        conclusion = COALESCE($15, conclusion),
        references_list = COALESCE($16, references_list),
        updated_at = NOW()
       WHERE id = $17 AND user_id = $18
       RETURNING *`,
      [
        doc_type, title, author, institution, department, course, instructor,
        doc_date, abstract, introduction,
        sections ? JSON.stringify(sections) : null,
        methodology, results, discussion, conclusion, references_list,
        req.params.id, req.user.id,
      ]
    );
    res.json({ document: doc });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/academic/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await pool.query(`DELETE FROM academic_documents WHERE id = $1 AND user_id = $2`, [req.params.id, req.user.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
