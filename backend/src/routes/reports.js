/**
 * /api/reports  — Consolidated reports router
 */

const router = require('express').Router();
const pool   = require('../lib/db');
const { authenticate, requireAdmin, requireLeader, requireSameChurch } = require('../middleware/auth');

// GET /api/reports/overview
router.get('/overview', authenticate, requireLeader, requireSameChurch, async (req, res) => {
  try {
    const cid = req.churchId;

    const [memberStats, financeStats, attendanceStats, choirStats] = await Promise.all([
      // Members
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE approval_status = 'approved')                     AS total_members,
          COUNT(*) FILTER (WHERE approval_status = 'pending')                      AS pending_members,
          COUNT(*) FILTER (WHERE approval_status = 'approved' AND gender = 'Male') AS male_members,
          COUNT(*) FILTER (WHERE approval_status = 'approved' AND gender = 'Female') AS female_members,
          COUNT(*) FILTER (WHERE
            approval_status = 'approved'
            AND EXTRACT(MONTH FROM date_of_birth) = EXTRACT(MONTH FROM CURRENT_DATE)
            AND EXTRACT(DAY   FROM date_of_birth) = EXTRACT(DAY   FROM CURRENT_DATE)
          ) AS birthdays_today,
          COUNT(*) FILTER (WHERE
            approval_status = 'approved'
            AND created_at >= NOW() - INTERVAL '30 days'
          ) AS new_this_month
        FROM members
        WHERE church_id = $1 AND deleted_at IS NULL`,
        [cid]
      ),

      // Finance — current month
      pool.query(`
        SELECT
          COALESCE(SUM(amount) FILTER (WHERE type='income'  AND payment_status='completed'), 0) AS total_income,
          COALESCE(SUM(amount) FILTER (WHERE type='expense' AND payment_status='completed'), 0) AS total_expense,
          COALESCE(SUM(amount) FILTER (WHERE payment_status='pending'), 0)                      AS pending_amount,
          COUNT(*) FILTER (WHERE type='income')                                                 AS income_count,
          COUNT(*) FILTER (WHERE type='expense')                                                AS expense_count
        FROM finance_transactions
        WHERE church_id = $1
          AND transaction_date >= DATE_TRUNC('month', CURRENT_DATE)`,
        [cid]
      ),

      // Attendance
      pool.query(`
        SELECT
          COUNT(*)                                              AS total_checked_in,
          COUNT(*) FILTER (WHERE status = 'present')           AS present,
          COUNT(*) FILTER (WHERE status = 'absent')            AS absent,
          COUNT(*) FILTER (WHERE status = 'late')              AS late,
          MAX(date)                                             AS last_service_date
        FROM attendance
        WHERE church_id = $1
          AND type = 'sunday_service'
          AND date = (
            SELECT MAX(date) FROM attendance
            WHERE church_id = $1 AND type = 'sunday_service'
          )`,
        [cid]
      ),

      // Choir
      pool.query(`
        SELECT
          COUNT(*)                                                      AS total_choir,
          COUNT(*) FILTER (WHERE approval_status = 'approved')         AS active_choir,
          COUNT(*) FILTER (WHERE approval_status = 'pending')          AS pending_choir,
          COUNT(*) FILTER (WHERE voice_group = 'Soprano')              AS soprano,
          COUNT(*) FILTER (WHERE voice_group = 'Alto')                 AS alto,
          COUNT(*) FILTER (WHERE voice_group = 'Tenor')                AS tenor,
          COUNT(*) FILTER (WHERE voice_group = 'Bass')                 AS bass
        FROM choir_members
        WHERE church_id = $1`,
        [cid]
      ),
    ]);

    const m = memberStats.rows[0];
    const f = financeStats.rows[0];
    const a = attendanceStats.rows[0];
    const c = choirStats.rows[0];

    res.json({
      members: {
        total:         parseInt(m.total_members),
        pending:       parseInt(m.pending_members),
        male:          parseInt(m.male_members),
        female:        parseInt(m.female_members),
        birthdaysToday: parseInt(m.birthdays_today),
        newThisMonth:  parseInt(m.new_this_month),
      },
      finance: {
        totalIncome:   parseFloat(f.total_income),
        totalExpense:  parseFloat(f.total_expense),
        balance:       parseFloat(f.total_income) - parseFloat(f.total_expense),
        pendingAmount: parseFloat(f.pending_amount),
        incomeCount:   parseInt(f.income_count),
        expenseCount:  parseInt(f.expense_count),
        period:        'current_month',
      },
      attendance: {
        totalCheckedIn:  parseInt(a.total_checked_in),
        present:         parseInt(a.present),
        absent:          parseInt(a.absent),
        late:            parseInt(a.late),
        lastServiceDate: a.last_service_date,
      },
      choir: {
        total:   parseInt(c.total_choir),
        active:  parseInt(c.active_choir),
        pending: parseInt(c.pending_choir),
        byVoice: {
          soprano: parseInt(c.soprano),
          alto:    parseInt(c.alto),
          tenor:   parseInt(c.tenor),
          bass:    parseInt(c.bass),
        },
      },
    });
  } catch (err) {
    console.error('reports/overview error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/members
router.get('/members', authenticate, requireAdmin, requireSameChurch, async (req, res) => {
  try {
    const cid = req.churchId;

    const [byStatus, byGender, byDept, byMonth, upcomingBirthdays] = await Promise.all([
      pool.query(`
        SELECT approval_status, COUNT(*) AS count
        FROM members WHERE church_id=$1 AND deleted_at IS NULL
        GROUP BY approval_status ORDER BY count DESC`,
        [cid]
      ),
      pool.query(`
        SELECT COALESCE(gender, 'Not specified') AS gender, COUNT(*) AS count
        FROM members WHERE church_id=$1 AND deleted_at IS NULL AND approval_status='approved'
        GROUP BY gender ORDER BY count DESC`,
        [cid]
      ),
      pool.query(`
        SELECT COALESCE(d.name, 'No Department') AS department, COUNT(m.id) AS count
        FROM members m
        LEFT JOIN departments d ON d.id = m.department_id
        WHERE m.church_id=$1 AND m.deleted_at IS NULL AND m.approval_status='approved'
        GROUP BY d.name ORDER BY count DESC`,
        [cid]
      ),
      pool.query(`
        SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
               COUNT(*) AS count
        FROM members
        WHERE church_id=$1 AND deleted_at IS NULL
          AND created_at >= NOW() - INTERVAL '12 months'
        GROUP BY month ORDER BY month ASC`,
        [cid]
      ),
      pool.query(`
        SELECT m.id, m.first_name, m.last_name, m.member_code,
               m.profile_photo_url, m.date_of_birth, m.phone, m.email,
               (DATE_PART('year', AGE(m.date_of_birth)) + 1)::INT AS turning_age
        FROM members m
        WHERE m.church_id=$1 AND m.deleted_at IS NULL
          AND m.approval_status='approved'
          AND m.date_of_birth IS NOT NULL
          AND (
            TO_CHAR(m.date_of_birth, 'MM-DD') BETWEEN
              TO_CHAR(CURRENT_DATE, 'MM-DD') AND
              TO_CHAR(CURRENT_DATE + INTERVAL '7 days', 'MM-DD')
          )
        ORDER BY TO_CHAR(m.date_of_birth, 'MM-DD') ASC`,
        [cid]
      ),
    ]);

    res.json({
      by_status:          byStatus.rows,
      by_gender:          byGender.rows,
      by_department:      byDept.rows,
      registrations_by_month: byMonth.rows,
      upcoming_birthdays: upcomingBirthdays.rows,
    });
  } catch (err) {
    console.error('reports/members error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/attendance
router.get('/attendance', authenticate, requireLeader, requireSameChurch, async (req, res) => {
  try {
    const cid = req.churchId;
    const { from_date, to_date, type } = req.query;

    let dateFilter = `WHERE a.church_id = $1`;
    const params   = [cid];
    let   idx      = 2;

    if (from_date) { dateFilter += ` AND a.date >= $${idx++}`; params.push(from_date); }
    if (to_date)   { dateFilter += ` AND a.date <= $${idx++}`; params.push(to_date); }
    if (type)      { dateFilter += ` AND a.type = $${idx++}`;  params.push(type); }

    const [byDate, byType, byMember, summary] = await Promise.all([
      pool.query(`
        SELECT a.date, a.type,
               COUNT(*) FILTER (WHERE a.status = 'present') AS present,
               COUNT(*) FILTER (WHERE a.status = 'absent')  AS absent,
               COUNT(*) FILTER (WHERE a.status = 'late')    AS late,
               COUNT(*) FILTER (WHERE a.status = 'excused') AS excused,
               COUNT(*)                                      AS total
        FROM attendance a
        ${dateFilter}
        GROUP BY a.date, a.type
        ORDER BY a.date DESC
        LIMIT 90`,
        params
      ),
      pool.query(`
        SELECT a.type,
               COUNT(*) FILTER (WHERE a.status = 'present') AS present,
               COUNT(*) FILTER (WHERE a.status = 'absent')  AS absent,
               COUNT(*)                                      AS total,
               ROUND(
                 100.0 * COUNT(*) FILTER (WHERE a.status = 'present') / NULLIF(COUNT(*), 0), 1
               ) AS attendance_rate
        FROM attendance a
        ${dateFilter}
        GROUP BY a.type ORDER BY total DESC`,
        params
      ),
      pool.query(`
        SELECT m.id, m.first_name, m.last_name, m.member_code,
               COUNT(*) FILTER (WHERE a.status = 'absent') AS absent_count,
               COUNT(*)                                     AS total_services
        FROM attendance a
        JOIN members m ON m.id = a.member_id
        ${dateFilter}
        GROUP BY m.id, m.first_name, m.last_name, m.member_code
        HAVING COUNT(*) FILTER (WHERE a.status = 'absent') > 0
        ORDER BY absent_count DESC
        LIMIT 10`,
        params
      ),
      pool.query(`
        SELECT
          COUNT(DISTINCT a.date)                                        AS total_services,
          COUNT(*)                                                      AS total_records,
          COUNT(*) FILTER (WHERE a.status = 'present')                 AS total_present,
          COUNT(*) FILTER (WHERE a.status = 'absent')                  AS total_absent,
          ROUND(
            100.0 * COUNT(*) FILTER (WHERE a.status = 'present') / NULLIF(COUNT(*), 0), 1
          )                                                             AS overall_rate
        FROM attendance a
        ${dateFilter}`,
        params
      ),
    ]);

    res.json({
      summary:        summary.rows[0],
      by_date:        byDate.rows,
      by_type:        byType.rows,
      frequent_absent: byMember.rows,
    });
  } catch (err) {
    console.error('reports/attendance error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/finance
router.get('/finance', authenticate, requireAdmin, requireSameChurch, async (req, res) => {
  try {
    const cid = req.churchId;
    const { from_date, to_date } = req.query;

    let dateFilter = `WHERE t.church_id = $1 AND t.payment_status = 'completed'`;
    const params   = [cid];
    let   idx      = 2;

    if (from_date) { dateFilter += ` AND t.transaction_date >= $${idx++}`; params.push(from_date); }
    if (to_date)   { dateFilter += ` AND t.transaction_date <= $${idx++}`; params.push(to_date); }

    const [totals, byCategory, byMethod, monthly, recentTx] = await Promise.all([
      pool.query(`
        SELECT
          COALESCE(SUM(amount) FILTER (WHERE type='income'),  0) AS total_income,
          COALESCE(SUM(amount) FILTER (WHERE type='expense'), 0) AS total_expense,
          COUNT(*) FILTER (WHERE type='income')                  AS income_count,
          COUNT(*) FILTER (WHERE type='expense')                 AS expense_count
        FROM finance_transactions t
        ${dateFilter}`,
        params
      ),
      pool.query(`
        SELECT
          COALESCE(fc.name, 'Uncategorised') AS category,
          t.type,
          COUNT(*) AS count,
          SUM(t.amount) AS total
        FROM finance_transactions t
        LEFT JOIN finance_categories fc ON fc.id = t.category_id
        ${dateFilter}
        GROUP BY fc.name, t.type
        ORDER BY t.type, total DESC`,
        params
      ),
      pool.query(`
        SELECT
          t.payment_method,
          t.type,
          COUNT(*) AS count,
          SUM(t.amount) AS total
        FROM finance_transactions t
        ${dateFilter}
        GROUP BY t.payment_method, t.type
        ORDER BY total DESC`,
        params
      ),
      pool.query(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', t.transaction_date), 'YYYY-MM') AS month,
          COALESCE(SUM(amount) FILTER (WHERE type='income'),  0) AS income,
          COALESCE(SUM(amount) FILTER (WHERE type='expense'), 0) AS expense
        FROM finance_transactions t
        ${dateFilter}
        GROUP BY month
        ORDER BY month ASC`,
        params
      ),
      pool.query(`
        SELECT t.id, t.amount, t.type, t.sub_type, t.payment_method,
               t.transaction_date, t.description, t.receipt_number,
               t.payment_status,
               fc.name AS category,
               m.first_name || ' ' || m.last_name AS member_name
        FROM finance_transactions t
        LEFT JOIN finance_categories fc ON fc.id = t.category_id
        LEFT JOIN members m ON m.id = t.member_id
        WHERE t.church_id = $1
        ORDER BY t.transaction_date DESC, t.created_at DESC
        LIMIT 10`,
        [cid]
      ),
    ]);

    const tot = totals.rows[0];
    res.json({
      totals: {
        income:       parseFloat(tot.total_income),
        expense:      parseFloat(tot.total_expense),
        balance:      parseFloat(tot.total_income) - parseFloat(tot.total_expense),
        income_count: parseInt(tot.income_count),
        expense_count: parseInt(tot.expense_count),
      },
      by_category:   byCategory.rows,
      by_method:     byMethod.rows,
      monthly_trend: monthly.rows,
      recent:        recentTx.rows,
      from_date:     from_date || null,
      to_date:       to_date || null,
    });
  } catch (err) {
    console.error('reports/finance error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/choir
router.get('/choir', authenticate, requireLeader, requireSameChurch, async (req, res) => {
  try {
    const cid = req.churchId;

    const [voiceBreakdown, attendanceTrend, musicStats, rehearsalStats] = await Promise.all([
      pool.query(`
        SELECT
          COALESCE(cm.voice_group, 'Unassigned') AS voice_group,
          cm.experience_level,
          COUNT(*) AS count
        FROM choir_members cm
        WHERE cm.church_id = $1 AND cm.approval_status = 'approved'
        GROUP BY cm.voice_group, cm.experience_level
        ORDER BY cm.voice_group, cm.experience_level`,
        [cid]
      ),
      pool.query(`
        SELECT a.date,
               COUNT(*) FILTER (WHERE a.status = 'present') AS present,
               COUNT(*) FILTER (WHERE a.status = 'absent')  AS absent,
               COUNT(*)                                      AS total
        FROM attendance a
        WHERE a.church_id = $1
          AND a.type = 'choir_rehearsal'
        GROUP BY a.date
        ORDER BY a.date DESC
        LIMIT 10`,
        [cid]
      ),
      pool.query(`
        SELECT
          COUNT(*)                                          AS total_songs,
          COUNT(DISTINCT genre)                             AS genres,
          COUNT(*) FILTER (WHERE lyrics IS NOT NULL)        AS songs_with_lyrics,
          COUNT(*) FILTER (WHERE file_url IS NOT NULL)      AS songs_with_audio,
          COUNT(*) FILTER (WHERE sheet_url IS NOT NULL)     AS songs_with_sheet
        FROM music_library
        WHERE church_id = $1`,
        [cid]
      ),
      pool.query(`
        SELECT id, title, rehearsal_date, start_time, end_time, location
        FROM rehearsals
        WHERE church_id = $1
          AND rehearsal_date >= CURRENT_DATE
        ORDER BY rehearsal_date ASC
        LIMIT 5`,
        [cid]
      ),
    ]);

    res.json({
      voice_breakdown:   voiceBreakdown.rows,
      attendance_trend:  attendanceTrend.rows,
      music:             musicStats.rows[0],
      upcoming_rehearsals: rehearsalStats.rows,
    });
  } catch (err) {
    console.error('reports/choir error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
