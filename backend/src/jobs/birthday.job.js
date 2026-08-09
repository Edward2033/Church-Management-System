const cron = require('node-cron');
const pool = require('../lib/db');
const { sendEmail, birthdayEmail } = require('../lib/email');

// ── Shared age calculation ────────────────────────────────────
function calcAge(dob) {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// ── Daily job: runs at 7 AM — notifies on the exact birthday ─
async function checkBirthdays() {
  try {
    const churchId = process.env.DEFAULT_CHURCH_ID;

    // Members whose birthday is TODAY
    const { rows } = await pool.query(
      `SELECT m.id, m.first_name, m.last_name, m.email, m.member_code,
              m.date_of_birth, m.profile_photo_url
       FROM members m
       INNER JOIN users u ON u.id = m.user_id
       WHERE m.church_id = $1
         AND m.approval_status = 'approved'
         AND m.deleted_at IS NULL
         AND m.date_of_birth IS NOT NULL
         AND EXTRACT(MONTH FROM m.date_of_birth) = EXTRACT(MONTH FROM CURRENT_DATE)
         AND EXTRACT(DAY   FROM m.date_of_birth) = EXTRACT(DAY   FROM CURRENT_DATE)`,
      [churchId]
    );

    if (rows.length === 0) return;

    // Send personal birthday email to each birthday member
    for (const member of rows) {
      if (member.email) {
        await sendEmail(birthdayEmail(member)).catch((err) =>
          console.error(`[Birthday email error] ${member.email}:`, err.message)
        );
      }
    }

    // Build notification content
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    const birthdayDetails = rows.map((m) => {
      const age = calcAge(m.date_of_birth);
      return `${m.first_name} ${m.last_name}${age > 0 ? ` (turning ${age})` : ''}`;
    }).join('\n');

    // Insert notification
    const { rows: [notification] } = await pool.query(
      `INSERT INTO notifications
        (church_id, title, message, type, audience, priority, status, publish_date)
       VALUES ($1, $2, $3, 'birthday', 'all', 'normal', 'published', NOW())
       RETURNING *`,
      [
        churchId,
        `🎂 Birthday${rows.length > 1 ? 's' : ''} Today — ${today}`,
        `🎉 Let's celebrate!\n\n${birthdayDetails}\n\nPlease join us in wishing ${rows.length > 1 ? 'them' : rows[0].first_name} a blessed and joyful birthday! May this new year of life be filled with God's grace, love, and abundant blessings.`,
      ]
    );

    // Deliver to all approved users
    const { rows: allUsers } = await pool.query(
      `SELECT u.id, m.email, m.first_name, m.last_name
       FROM members m
       INNER JOIN users u ON u.id = m.user_id
       WHERE m.church_id = $1 AND m.approval_status = 'approved' AND m.deleted_at IS NULL`,
      [churchId]
    );

    for (const user of allUsers) {
      await pool.query(
        `INSERT INTO notification_delivery (notification_id, user_id, email_sent, email_sent_at)
         VALUES ($1, $2, TRUE, NOW())
         ON CONFLICT (notification_id, user_id) DO NOTHING`,
        [notification.id, user.id]
      );
      if (user.email) {
        await sendEmail({
          to: user.email,
          subject: `🎂 Birthday Celebration Today!`,
          html: generateDailyBirthdayEmail(rows, user, today),
        }).catch((err) =>
          console.error(`[Birthday notify error] ${user.email}:`, err.message)
        );
      }
    }

    await pool.query(
      `UPDATE notifications SET delivered_count = $1 WHERE id = $2`,
      [allUsers.length, notification.id]
    );

    console.log(`[Birthday daily] ${rows.length} birthday(s), notified ${allUsers.length} users`);
  } catch (err) {
    console.error('[Birthday daily job error]', err.message);
  }
}

// ── Monthly job: runs on the 1st of each month at 8 AM ───────
// Lists ALL birthdays in the current month so members can plan ahead
async function sendMonthlyBirthdayReminder() {
  try {
    const churchId = process.env.DEFAULT_CHURCH_ID;
    const now = new Date();
    const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // All approved members with a birthday this month
    const { rows } = await pool.query(
      `SELECT m.id, m.first_name, m.last_name, m.email, m.member_code,
              m.date_of_birth, m.profile_photo_url
       FROM members m
       INNER JOIN users u ON u.id = m.user_id
       WHERE m.church_id = $1
         AND m.approval_status = 'approved'
         AND m.deleted_at IS NULL
         AND m.date_of_birth IS NOT NULL
         AND EXTRACT(MONTH FROM m.date_of_birth) = EXTRACT(MONTH FROM CURRENT_DATE)
       ORDER BY EXTRACT(DAY FROM m.date_of_birth)`,
      [churchId]
    );

    if (rows.length === 0) {
      console.log(`[Birthday monthly] No birthdays in ${monthName}`);
      return;
    }

    // Build list with dates
    const birthdayList = rows.map((m) => {
      const day = new Date(m.date_of_birth).getUTCDate();
      const age = calcAge(m.date_of_birth);
      const suffix = day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th';
      return `• ${m.first_name} ${m.last_name} — ${monthName.split(' ')[0]} ${day}${suffix}${age > 0 ? ` (turning ${age})` : ''}`;
    }).join('\n');

    // Insert monthly reminder notification
    const { rows: [notification] } = await pool.query(
      `INSERT INTO notifications
        (church_id, title, message, type, audience, priority, status, publish_date)
       VALUES ($1, $2, $3, 'birthday', 'all', 'normal', 'published', NOW())
       RETURNING *`,
      [
        churchId,
        `🎂 Birthdays This Month — ${monthName}`,
        `Here are all the birthdays to celebrate in ${monthName}:\n\n${birthdayList}\n\nLet's remember to celebrate and pray for each of them on their special day! 🙏`,
      ]
    );

    // Deliver to all approved users
    const { rows: allUsers } = await pool.query(
      `SELECT u.id, m.email, m.first_name, m.last_name
       FROM members m
       INNER JOIN users u ON u.id = m.user_id
       WHERE m.church_id = $1 AND m.approval_status = 'approved' AND m.deleted_at IS NULL`,
      [churchId]
    );

    for (const user of allUsers) {
      await pool.query(
        `INSERT INTO notification_delivery (notification_id, user_id, email_sent, email_sent_at)
         VALUES ($1, $2, TRUE, NOW())
         ON CONFLICT (notification_id, user_id) DO NOTHING`,
        [notification.id, user.id]
      );
      if (user.email) {
        await sendEmail({
          to: user.email,
          subject: `🎂 Birthdays This Month — ${monthName}`,
          html: generateMonthlyBirthdayEmail(rows, user, monthName),
        }).catch((err) =>
          console.error(`[Monthly birthday notify error] ${user.email}:`, err.message)
        );
      }
    }

    await pool.query(
      `UPDATE notifications SET delivered_count = $1 WHERE id = $2`,
      [allUsers.length, notification.id]
    );

    console.log(`[Birthday monthly] ${rows.length} birthday(s) in ${monthName}, notified ${allUsers.length} users`);
  } catch (err) {
    console.error('[Birthday monthly job error]', err.message);
  }
}

// ── Email templates ───────────────────────────────────────────

function generateDailyBirthdayEmail(birthdayMembers, recipient, dateString) {
  const memberList = birthdayMembers.map((m) => {
    const age = calcAge(m.date_of_birth);
    return `
      <div style="display:flex;align-items:center;gap:15px;padding:15px;background:#fef3c7;border-radius:8px;margin-bottom:10px;">
        <img src="${m.profile_photo_url || 'https://placehold.co/60'}" alt="${m.first_name}"
             style="width:60px;height:60px;border-radius:50%;object-fit:cover;border:3px solid #f59e0b;" />
        <div>
          <div style="font-weight:bold;font-size:16px;color:#92400e;">${m.first_name} ${m.last_name}</div>
          ${age > 0 ? `<div style="color:#78350f;font-size:14px;">Turning ${age} years old 🎉</div>` : ''}
          <div style="color:#78350f;font-size:12px;">Member Code: ${m.member_code}</div>
        </div>
      </div>`;
  }).join('');

  return `<!DOCTYPE html><html><head><style>
    body{font-family:Arial,sans-serif;line-height:1.6;color:#333;}
    .container{max-width:600px;margin:0 auto;padding:20px;}
    .header{background:linear-gradient(135deg,#f59e0b,#d97706);color:white;padding:30px;border-radius:8px 8px 0 0;text-align:center;}
    .content{background:#fff;padding:30px;border:1px solid #e5e7eb;}
    .footer{background:#f3f4f6;padding:15px;text-align:center;font-size:12px;color:#6b7280;border-radius:0 0 8px 8px;}
  </style></head><body>
  <div class="container">
    <div class="header">
      <div style="font-size:48px;">🎂🎉🎈</div>
      <h1 style="margin:0;font-size:28px;">Birthday Celebration!</h1>
      <p style="margin:10px 0 0;font-size:15px;">${dateString}</p>
    </div>
    <div class="content">
      <p>Hello <strong>${recipient.first_name}</strong>,</p>
      <p>We have special birthday${birthdayMembers.length > 1 ? 's' : ''} to celebrate today! 🎊</p>
      ${memberList}
      <div style="background:#dbeafe;border-left:4px solid #3b82f6;padding:20px;margin:20px 0;border-radius:4px;">
        <p style="margin:0;font-style:italic;">"For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, plans to give you hope and a future."</p>
        <p style="margin:10px 0 0;text-align:right;font-weight:bold;color:#1e40af;">— Jeremiah 29:11</p>
      </div>
      <p>Please join us in wishing ${birthdayMembers.length > 1 ? 'them' : birthdayMembers[0].first_name} a blessed and joyful birthday!</p>
      <p style="text-align:center;margin-top:30px;">
        <a href="${process.env.FRONTEND_URL}/dashboard" style="display:inline-block;padding:12px 24px;background:#f59e0b;color:white;text-decoration:none;border-radius:6px;font-weight:bold;">View in Dashboard</a>
      </p>
    </div>
    <div class="footer"><p>Automated birthday notification from LUS4G Church Management System.</p></div>
  </div></body></html>`;
}

function generateMonthlyBirthdayEmail(birthdayMembers, recipient, monthName) {
  const rows = birthdayMembers.map((m) => {
    const day = new Date(m.date_of_birth).getUTCDate();
    const age = calcAge(m.date_of_birth);
    const suffix = day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th';
    return `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;">
          <div style="display:flex;align-items:center;gap:10px;">
            <img src="${m.profile_photo_url || 'https://placehold.co/40'}" alt="${m.first_name}"
                 style="width:40px;height:40px;border-radius:50%;object-fit:cover;" />
            <span style="font-weight:600;">${m.first_name} ${m.last_name}</span>
          </div>
        </td>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;color:#7c3aed;font-weight:600;">
          ${monthName.split(' ')[0]} ${day}${suffix}
        </td>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;color:#6b7280;">
          ${age > 0 ? `Turning ${age}` : ''}
        </td>
      </tr>`;
  }).join('');

  return `<!DOCTYPE html><html><head><style>
    body{font-family:Arial,sans-serif;line-height:1.6;color:#333;}
    .container{max-width:600px;margin:0 auto;padding:20px;}
    .header{background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;padding:30px;border-radius:8px 8px 0 0;text-align:center;}
    .content{background:#fff;padding:30px;border:1px solid #e5e7eb;}
    .footer{background:#f3f4f6;padding:15px;text-align:center;font-size:12px;color:#6b7280;border-radius:0 0 8px 8px;}
    table{width:100%;border-collapse:collapse;}
    th{background:#f3f4f6;padding:10px;text-align:left;font-size:12px;text-transform:uppercase;color:#6b7280;}
  </style></head><body>
  <div class="container">
    <div class="header">
      <div style="font-size:48px;">🗓️🎂</div>
      <h1 style="margin:0;font-size:26px;">Birthdays This Month</h1>
      <p style="margin:10px 0 0;font-size:15px;">${monthName}</p>
    </div>
    <div class="content">
      <p>Hello <strong>${recipient.first_name}</strong>,</p>
      <p>Here are all the birthdays to celebrate in <strong>${monthName}</strong>. Let's remember to pray for and celebrate each of them! 🙏</p>
      <table>
        <thead><tr><th>Member</th><th>Date</th><th>Age</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="text-align:center;margin-top:30px;">
        <a href="${process.env.FRONTEND_URL}/dashboard" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:white;text-decoration:none;border-radius:6px;font-weight:bold;">View in Dashboard</a>
      </p>
    </div>
    <div class="footer"><p>Automated monthly birthday reminder from LUS4G Church Management System.</p></div>
  </div></body></html>`;
}

// ── Register both jobs ────────────────────────────────────────
function registerBirthdayJob() {
  // Daily at 7:00 AM — exact birthday notification
  cron.schedule('0 7 * * *', checkBirthdays);

  // 1st of every month at 8:00 AM — monthly birthday list reminder
  cron.schedule('0 8 1 * *', sendMonthlyBirthdayReminder);

  // Run daily check on startup (skip monthly on startup to avoid spam)
  checkBirthdays();

  console.log('[Jobs] Birthday job registered (daily 7AM + monthly 1st 8AM)');
}

module.exports = { registerBirthdayJob, checkBirthdays, sendMonthlyBirthdayReminder };
