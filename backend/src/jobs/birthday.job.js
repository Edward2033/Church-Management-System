const cron = require('node-cron');
const pool = require('../lib/db');
const { sendEmail, birthdayEmail } = require('../lib/email');

async function checkBirthdays() {
  try {
    const churchId = process.env.DEFAULT_CHURCH_ID;
    
    // Get members with birthdays today
    const { rows } = await pool.query(
      `SELECT m.id, m.first_name, m.last_name, m.email, m.member_code, m.date_of_birth, m.profile_photo_url
       FROM users m
       WHERE m.church_id = $1
         AND m.approval_status = 'approved'
         AND m.deleted_at IS NULL
         AND m.date_of_birth IS NOT NULL
         AND EXTRACT(MONTH FROM m.date_of_birth) = EXTRACT(MONTH FROM CURRENT_DATE)
         AND EXTRACT(DAY   FROM m.date_of_birth) = EXTRACT(DAY   FROM CURRENT_DATE)`,
      [churchId]
    );

    if (rows.length === 0) {
      return; // No birthdays today
    }

    // Send individual birthday emails
    for (const member of rows) {
      if (member.email) {
        await sendEmail(birthdayEmail(member)).catch((err) =>
          console.error(`[Birthday email error] ${member.email}:`, err.message)
        );
      }
    }

    // Create notification for ALL users about today's birthdays
    const birthdayNames = rows.map(m => m.first_name).join(', ');
    const birthdayDetails = rows.map(m => {
      const age = new Date().getFullYear() - new Date(m.date_of_birth).getFullYear();
      return `${m.first_name} ${m.last_name}${age > 0 ? ` (${age} years old)` : ''}`;
    }).join('\n');
    
    const today = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Create notification in the new notifications table
    const { rows: [notification] } = await pool.query(
      `INSERT INTO notifications 
        (church_id, title, message, type, audience, priority, status, publish_date)
       VALUES ($1, $2, $3, 'birthday', 'all', 'normal', 'published', NOW())
       RETURNING *`,
      [
        churchId,
        `🎂 Birthday${rows.length > 1 ? 's' : ''} Today - ${today}`,
        `🎉 Let's celebrate!\n\n${birthdayDetails}\n\nPlease join us in wishing ${rows.length > 1 ? 'them' : birthdayNames} a blessed and joyful birthday! May this new year of life be filled with God's grace, love, and abundant blessings.`
      ]
    );

    // Deliver notification to all approved users
    const { rows: allUsers } = await pool.query(
      `SELECT id, email, first_name, last_name
       FROM users
       WHERE church_id = $1 AND approval_status = 'approved'`,
      [churchId]
    );

    // Create delivery records for all users
    for (const user of allUsers) {
      await pool.query(
        `INSERT INTO notification_delivery (notification_id, user_id, email_sent, email_sent_at)
         VALUES ($1, $2, TRUE, NOW())
         ON CONFLICT (notification_id, user_id) DO NOTHING`,
        [notification.id, user.id]
      );
      
      // Send email notification to each user
      try {
        await sendEmail({
          to: user.email,
          subject: `🎂 Birthday Celebration Today!`,
          html: generateBirthdayNotificationEmail(rows, user, today)
        });
      } catch (emailErr) {
        console.error(`Failed to send birthday notification to ${user.email}:`, emailErr.message);
      }
    }

    // Update notification counts
    await pool.query(
      `UPDATE notifications
       SET delivered_count = $1
       WHERE id = $2`,
      [allUsers.length, notification.id]
    );

    console.log(`[Birthday] Processed ${rows.length} birthday(s), notified ${allUsers.length} users`);
  } catch (err) {
    console.error('[Birthday job error]', err.message);
  }
}

function generateBirthdayNotificationEmail(birthdayMembers, recipient, dateString) {
  const memberList = birthdayMembers.map(m => {
    const age = new Date().getFullYear() - new Date(m.date_of_birth).getFullYear();
    return `
      <div style="display: flex; align-items: center; gap: 15px; padding: 15px; background: #fef3c7; border-radius: 8px; margin-bottom: 10px;">
        <img src="${m.profile_photo_url || 'https://placehold.co/60'}" alt="${m.first_name}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 3px solid #f59e0b;" />
        <div>
          <div style="font-weight: bold; font-size: 16px; color: #92400e;">${m.first_name} ${m.last_name}</div>
          ${age > 0 ? `<div style="color: #78350f; font-size: 14px;">Turning ${age} years old</div>` : ''}
          <div style="color: #78350f; font-size: 12px;">Member Code: ${m.member_code}</div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
        .balloon { font-size: 48px; margin-bottom: 10px; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="balloon">🎂🎉🎈</div>
          <h1 style="margin: 0; font-size: 32px;">Birthday Celebration!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">${dateString}</p>
        </div>
        <div class="content">
          <p>Hello <strong>${recipient.first_name}</strong>,</p>
          
          <p>We have special birthday${birthdayMembers.length > 1 ? 's' : ''} to celebrate today! 🎊</p>
          
          ${memberList}
          
          <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-style: italic;">
              "For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, plans to give you hope and a future."
            </p>
            <p style="margin: 10px 0 0 0; text-align: right; font-weight: bold; color: #1e40af;">— Jeremiah 29:11</p>
          </div>
          
          <p>Please join us in wishing ${birthdayMembers.length > 1 ? 'them' : birthdayMembers[0].first_name} a blessed and joyful birthday! May this new year of life be filled with God's grace, love, and abundant blessings.</p>
          
          <p style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL}/dashboard" style="display: inline-block; padding: 12px 24px; background: #f59e0b; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">View in Dashboard</a>
          </p>
        </div>
        <div class="footer">
          <p>This is an automated birthday notification from LUS4G Church Management System.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function registerBirthdayJob() {
  // Run at 7:00 AM daily
  cron.schedule('0 7 * * *', checkBirthdays);
  // Also run once on startup
  checkBirthdays();
  console.log('[Jobs] Birthday job registered');
}

module.exports = { registerBirthdayJob, checkBirthdays };
