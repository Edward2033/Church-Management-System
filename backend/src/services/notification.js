'use strict';
const { sendEmail, eventInviteEmail, broadcastEmail } = require('../lib/email');

let twilioClient = null;
function getTwilio() {
  if (!twilioClient && process.env.TWILIO_SID && process.env.TWILIO_AUTH_TOKEN) {
    const twilio = require('twilio');
    twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
}

async function sendSMS(to, body) {
  const client = getTwilio();
  if (!client || !process.env.TWILIO_PHONE) {
    console.log('[SMS skipped]', { to, body: body.slice(0, 50) });
    return;
  }
  try {
    await client.messages.create({ body, from: process.env.TWILIO_PHONE, to });
  } catch (err) { console.error('[SMS error]', err.message); }
}

async function sendWhatsApp(to, body) {
  const client = getTwilio();
  if (!client || !process.env.TWILIO_WHATSAPP_NUMBER) {
    console.log('[WhatsApp skipped]', { to });
    return;
  }
  try {
    const whatsappTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    await client.messages.create({ body, from: process.env.TWILIO_WHATSAPP_NUMBER, to: whatsappTo });
  } catch (err) { console.error('[WhatsApp error]', err.message); }
}

async function notifyEventInvite(member, event, attendLink, notAttendLink) {
  const promises = [];
  if (member.email) promises.push(sendEmail(eventInviteEmail(member, event, attendLink, notAttendLink)));
  if (member.phone) promises.push(sendSMS(member.phone,
    `Hi ${member.name || member.first_name}, you're invited to ${event.title} on ${event.event_date}.\nAttend: ${attendLink}\nCan't attend: ${notAttendLink}`
  ));
  if (member.whatsapp || member.whatsapp_number) promises.push(sendWhatsApp(
    member.whatsapp || member.whatsapp_number,
    `Hi ${member.name || member.first_name}, you're invited to *${event.title}* on ${event.event_date}.\n✅ Attend: ${attendLink}\n❌ Can't attend: ${notAttendLink}`
  ));
  await Promise.allSettled(promises);
}

async function notifyBroadcast(member, message) {
  const promises = [];
  if (member.email) promises.push(sendEmail(broadcastEmail(member, message)));
  if (member.phone) promises.push(sendSMS(member.phone, message));
  if (member.whatsapp || member.whatsapp_number) promises.push(sendWhatsApp(
    member.whatsapp || member.whatsapp_number, message
  ));
  await Promise.allSettled(promises);
}

module.exports = { sendSMS, sendWhatsApp, notifyEventInvite, notifyBroadcast };
