const router = require('express').Router();
const pool   = require('../lib/db');
const { authenticate, requireAdmin, requireLeader, requireSameChurch } = require('../middleware/auth');

// GET /api/finance/categories
router.get('/categories', authenticate, requireSameChurch, async (req, res) => {
  try {
    const { type } = req.query;
    let q = `SELECT * FROM finance_categories WHERE church_id=$1 AND is_active=TRUE`;
    const params = [req.churchId]; let idx = 2;
    if (type) { q += ` AND type=$${idx++}`; params.push(type); }
    q += ' ORDER BY type, name';
    const { rows } = await pool.query(q, params);
    res.json({ categories: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/finance/categories
router.post('/categories', authenticate, requireAdmin, requireSameChurch, async (req, res) => {
  try {
    const { name, type, description } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'name and type required' });
    if (!['income','expense'].includes(type))
      return res.status(400).json({ error: 'type must be income or expense' });
    const { rows: [c] } = await pool.query(
      `INSERT INTO finance_categories (church_id,name,type,description) VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.churchId, name, type, description]
    );
    res.status(201).json({ category: c });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/finance/transactions
router.get('/transactions', authenticate, requireLeader, requireSameChurch, async (req, res) => {
  try {
    const { type, payment_status, category_id, from_date, to_date, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let q = `SELECT t.*, c.name AS category_name,
               m.first_name||' '||m.last_name AS member_name
             FROM finance_transactions t
             LEFT JOIN finance_categories c ON c.id=t.category_id
             LEFT JOIN members m ON m.id=t.member_id
             WHERE t.church_id=$1`;
    const params = [req.churchId]; let idx = 2;
    if (type)           { q += ` AND t.type=$${idx++}`;            params.push(type); }
    if (payment_status) { q += ` AND t.payment_status=$${idx++}`;  params.push(payment_status); }
    if (category_id)    { q += ` AND t.category_id=$${idx++}`;     params.push(category_id); }
    if (from_date)      { q += ` AND t.transaction_date>=$${idx++}`; params.push(from_date); }
    if (to_date)        { q += ` AND t.transaction_date<=$${idx++}`; params.push(to_date); }

    const countQ = q.replace(/SELECT t\.\*.*?FROM finance_transactions t/, 'SELECT COUNT(*) AS total FROM finance_transactions t');
    const [data, countRes] = await Promise.all([
      pool.query(q + ` ORDER BY t.transaction_date DESC, t.created_at DESC LIMIT $${idx} OFFSET $${idx+1}`,
        [...params, parseInt(limit), offset]),
      pool.query(countQ, params),
    ]);
    res.json({ transactions: data.rows, total: parseInt(countRes.rows[0]?.total || 0), page: parseInt(page) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/finance/transactions
router.post('/transactions', authenticate, requireLeader, requireSameChurch, async (req, res) => {
  try {
    const {
      category_id, member_id, donor_name, donor_email,
      amount, currency = 'GHS', type, sub_type,
      payment_method = 'cash', payment_ref, payment_status = 'completed',
      transaction_date, description,
    } = req.body;
    if (!amount || !type) return res.status(400).json({ error: 'amount and type required' });
    if (!['income','expense'].includes(type))
      return res.status(400).json({ error: 'type must be income or expense' });

    const { rows: [rcp] } = await pool.query(`SELECT generate_receipt_number() AS rn`);

    const { rows: [t] } = await pool.query(
      `INSERT INTO finance_transactions
         (church_id,category_id,member_id,donor_name,donor_email,amount,currency,type,sub_type,
          payment_method,payment_ref,payment_status,transaction_date,description,receipt_number,
          recorded_by,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,COALESCE($13,CURRENT_DATE),$14,$15,$16,$16)
       RETURNING *`,
      [req.churchId, category_id || null, member_id || null, donor_name, donor_email,
       parseFloat(amount), currency, type, sub_type, payment_method, payment_ref,
       payment_status, transaction_date || null, description, rcp.rn, req.user.id]
    );
    res.status(201).json({ transaction: t });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/finance/summary
router.get('/summary', authenticate, requireLeader, requireSameChurch, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const interval = period === 'year' ? '1 year' : period === 'week' ? '7 days' : '1 month';

    const { rows } = await pool.query(`
      SELECT
        type,
        SUM(amount) FILTER (WHERE payment_status='completed')          AS total,
        COUNT(*) FILTER (WHERE payment_status='completed')             AS count,
        SUM(amount) FILTER (WHERE payment_status='pending')            AS pending_amount,
        COUNT(*) FILTER (WHERE payment_status='pending')               AS pending_count
      FROM finance_transactions
      WHERE church_id=$1
        AND transaction_date >= CURRENT_DATE - INTERVAL '${interval}'
      GROUP BY type`,
      [req.churchId]
    );

    const summary = { income: { total: 0, count: 0 }, expense: { total: 0, count: 0 }, pending: 0 };
    rows.forEach((r) => {
      summary[r.type] = { total: parseFloat(r.total || 0), count: parseInt(r.count) };
      summary.pending += parseFloat(r.pending_amount || 0);
    });
    summary.balance = summary.income.total - summary.expense.total;
    res.json({ summary, period });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/finance/report
router.get('/report', authenticate, requireAdmin, requireSameChurch, async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    let dateFilter = `WHERE t.church_id=$1`;
    const params = [req.churchId]; let idx = 2;
    if (from_date) { dateFilter += ` AND t.transaction_date>=$${idx++}`; params.push(from_date); }
    if (to_date)   { dateFilter += ` AND t.transaction_date<=$${idx++}`; params.push(to_date); }

    const byCategory = await pool.query(`
      SELECT c.name AS category, t.type,
             SUM(t.amount) AS total, COUNT(*) AS count
      FROM finance_transactions t
      LEFT JOIN finance_categories c ON c.id=t.category_id
      ${dateFilter} AND t.payment_status='completed'
      GROUP BY c.name, t.type ORDER BY t.type, total DESC`, params);

    const byMethod = await pool.query(`
      SELECT t.payment_method, t.type,
             SUM(t.amount) AS total, COUNT(*) AS count
      FROM finance_transactions t
      ${dateFilter} AND t.payment_status='completed'
      GROUP BY t.payment_method, t.type ORDER BY total DESC`, params);

    const totals = await pool.query(`
      SELECT t.type, SUM(t.amount) AS total
      FROM finance_transactions t
      ${dateFilter} AND t.payment_status='completed'
      GROUP BY t.type`, params);

    const result = { by_category: byCategory.rows, by_method: byMethod.rows, totals: {} };
    totals.rows.forEach((r) => { result.totals[r.type] = parseFloat(r.total || 0); });
    result.totals.balance = (result.totals.income || 0) - (result.totals.expense || 0);
    res.json({ report: result, from_date, to_date });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/finance/transactions/:id
router.delete('/transactions/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM finance_transactions WHERE id=$1', [req.params.id]);
    res.json({ message: 'Transaction deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
