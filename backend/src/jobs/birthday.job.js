const cron = require('node-cron');
const pool = require('../lib/db');
const { sendEmail, birthdayEmail } = require('../lib/email');

async function checkBirthdays() {
  try {
    const churchId = process.env.DEFAULT_CHURCH_ID;
    const { rows } = await pool.query(
      `SELECT m.id, m.first_name, m.last_name, m.email, m.member_code
       FROM members m
       WHERE m.church_id = $1
         AND m.approval_status = 'approved'
         AND m.deleted_at IS NULL
         AND m.date_of_birth IS NOT NULL
         AND EXTRACT(MONTH FROM m.date_of_birth) = EXTRACT(MONTH FROM CURRENT_DATE)
         AND EXTRACT(DAY   FROM m.date_of_birth) = EXTRACT(DAY   FROM CURRENT_DATE)`,
      [churchId]
    );

    for (const member of rows) {
      if (member.email) {
        await sendEmail(birthdayEmail(member)).catch((err) =>
          console.error(`[Birthday email error] ${member.email}:`, err.message)
        );
      }
      // Create in-app notification
      await pool.query(
        `INSERT INTO notifications (church_id, title, message, type, audience)
         VALUES ($1, $2, $3, 'birthday', 'all')`,
        [
          churchId,
          `🎂 Happy Birthday, ${member.first_name}!`,
          `Today is ${member.first_name} ${member.last_name}'s birthday. Wish them well!`,
        ]
      ).catch(() => {});
    }

    if (rows.length > 0) {
      console.log(`[Birthday] Processed ${rows.length} birthday(s)`);
    }
  } catch (err) {
    console.error('[Birthday job error]', err.message);
  }
}

function registerBirthdayJob() {
  // Run at 7:00 AM daily
  cron.schedule('0 7 * * *', checkBirthdays);
  // Also run once on startup
  checkBirthdays();
  console.log('[Jobs] Birthday job registered');
}

module.exports = { registerBirthdayJob, checkBirthdays };
