const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST || 'smtp.gmail.com',
      port:   parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

async function sendEmail({ to, subject, html }) {
  if (!process.env.SMTP_USER) {
    console.log('[Email skipped — no SMTP config]', { to, subject });
    return;
  }
  return getTransporter().sendMail({
    from: process.env.EMAIL_FROM || 'LUS4G Church <no-reply@lus4g.org>',
    to, subject, html,
  });
}

function wrap(content) {
  return `<!DOCTYPE html><html><body style="font-family:Inter,Arial,sans-serif;background:#0f172a;color:#e2e8f0;margin:0;padding:0">
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.1)">
      <tr><td style="background:linear-gradient(135deg,#4c1d95,#7c3aed);padding:32px 40px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:24px">LUS4G Church</h1>
      </td></tr>
      <tr><td style="padding:40px">${content}</td></tr>
      <tr><td style="padding:20px 40px;text-align:center;border-top:1px solid rgba(255,255,255,0.1);color:#64748b;font-size:12px">
        © ${new Date().getFullYear()} LUS4G Church. All rights reserved.
      </td></tr>
    </table></td></tr></table></body></html>`;
}

const btn = (label, url) =>
  `<div style="text-align:center;margin:32px 0">
     <a href="${url}" style="background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block">${label}</a>
   </div>`;

module.exports.sendEmail = sendEmail;

module.exports.approvalEmail = (member, setupLink) => ({
  to: member.email,
  subject: '🎉 Your LUS4G Church Account Has Been Approved!',
  html: wrap(`
    <p style="color:#e2e8f0">Dear <strong>${member.first_name} ${member.last_name}</strong>,</p>
    <p style="color:#94a3b8">We are pleased to inform you that your registration with <strong style="color:#a78bfa">LUS4G Church</strong> has been <strong style="color:#4ade80">approved</strong> by our admin team. Welcome to the family!</p>
    <div style="background:#0f172a;border-radius:10px;padding:20px;margin:20px 0;border:1px solid rgba(167,139,250,0.3)">
      <p style="margin:6px 0;color:#94a3b8"><strong style="color:#e2e8f0">Member ID:</strong> <span style="color:#a78bfa;font-size:20px;font-weight:700">${member.member_code}</span></p>
      <p style="margin:6px 0;color:#94a3b8"><strong style="color:#e2e8f0">Email:</strong> ${member.email}</p>
      <p style="margin:6px 0;color:#94a3b8"><strong style="color:#e2e8f0">Role:</strong> <span style="text-transform:capitalize">${(member.role || 'member').replace('_',' ')}</span></p>
    </div>
    <p style="color:#94a3b8">Click the button below to set your password and activate your account:</p>
    ${btn('Set Up Your Password', setupLink)}
    <p style="color:#94a3b8">After setting your password, log in at: <a href="${process.env.FRONTEND_URL}/login" style="color:#a78bfa">${process.env.FRONTEND_URL}/login</a></p>
    <p style="color:#64748b;font-size:13px">This setup link expires in 48 hours. If you did not register with LUS4G Church, please ignore this email.</p>
    <p style="color:#64748b;font-size:13px">Or copy this link: <a href="${setupLink}" style="color:#a78bfa">${setupLink}</a></p>
  `),
});

module.exports.birthdayEmail = (member) => ({
  to: member.email,
  subject: '🎂 Happy Birthday from LUS4G Church!',
  html: wrap(`
    <div style="text-align:center">
      <div style="font-size:72px;margin-bottom:16px">🎂</div>
      <h2 style="color:#fcd34d">Happy Birthday, ${member.first_name}!</h2>
      <p style="color:#94a3b8;font-size:18px">Wishing you a blessed and joyful birthday filled with God's grace and love.</p>
      <p style="color:#64748b">— Your LUS4G Church Family</p>
    </div>
  `),
});

module.exports.passwordResetEmail = (user, resetLink) => ({
  to: user.email,
  subject: '🔐 Reset Your LUS4G Church Password',
  html: wrap(`
    <p style="color:#e2e8f0">You requested a password reset.</p>
    ${btn('Reset Password', resetLink)}
    <p style="color:#64748b;font-size:13px">This link expires in 1 hour. If you did not request this, please ignore.</p>
  `),
});

// Choir-specific emails (from LUS4G system)
module.exports.eventInviteEmail = (member, event, attendLink, notAttendLink) => ({
  to: member.email,
  subject: `📅 Event Invitation: ${event.title}`,
  html: wrap(`
    <p style="color:#e2e8f0">Dear <strong>${member.name || member.first_name}</strong>,</p>
    <p style="color:#94a3b8">You are invited to: <strong style="color:#a78bfa">${event.title}</strong></p>
    <p style="color:#94a3b8">📅 Date: ${event.event_date} ${event.event_time ? '@ ' + event.event_time : ''}</p>
    ${event.location ? `<p style="color:#94a3b8">📍 Location: ${event.location}</p>` : ''}
    ${event.dress_code ? `<p style="color:#94a3b8">👔 Dress Code: ${event.dress_code}</p>` : ''}
    <div style="text-align:center;margin:32px 0;display:flex;gap:16px;justify-content:center">
      <a href="${attendLink}" style="background:#16a34a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">✅ I'll Attend</a>
      <a href="${notAttendLink}" style="background:#dc2626;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">❌ Can't Attend</a>
    </div>
  `),
});

module.exports.broadcastEmail = (member, message) => ({
  to: member.email,
  subject: '📢 Message from LUS4G Church',
  html: wrap(`
    <p style="color:#e2e8f0">Dear <strong>${member.name || member.first_name}</strong>,</p>
    <div style="background:#0f172a;border-radius:8px;padding:20px;margin:16px 0">
      <p style="color:#e2e8f0;white-space:pre-wrap">${message}</p>
    </div>
  `),
});
