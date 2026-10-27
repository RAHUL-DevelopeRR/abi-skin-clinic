import { ApiError } from './http.js';
import { hashText } from './auth.js';
import { sendSmsWakeUp } from './push.js';
import { alreadyNotified, formatDisplayTime } from './patient-messages.js';
import { getZonedNow } from './schedule.js';

const SMS_LIMIT = 160;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// A job stuck in "sending" this long (phone died mid-send) is offered to the phone again.
const STALE_SENDING_MINUTES = 10;
const MAX_ATTEMPTS = 3;

function shortDate(value) {
  const date = new Date(`${value}T00:00:00Z`);
  return `${WEEKDAYS[date.getUTCDay()]} ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
}

// GSM 03.38 basic characters. Any other character (a name typed in Tamil, an emoji) makes the
// network send the SMS as Unicode, which fits only 70 characters and splits into several SMS.
const GSM_7BIT = /^[@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&'()*+,\-./0-9:;<=>?¡A-ZÄÖÑÜ§¿a-zäöñüà]*$/;

export function isGsm7(text) {
  return GSM_7BIT.test(String(text));
}

function firstName(name) {
  const first = String(name || '').trim().split(/\s+/)[0].slice(0, 20);
  return first && isGsm7(first) ? first : 'there';
}

function shortBranch(name) {
  return String(name || '').replace(/\s*Clinic.*$/i, '').trim() || 'ABI';
}

function localPhone(phone) {
  return String(phone || '').replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, '');
}

/**
 * One-SMS patient messages. Each event has a full and a shorter variant; the first that
 * fits in 160 characters is used, so long names or treatments drop the treatment name.
 */
export function buildSmsMessage(event, appointment, origin) {
  const host = new URL(origin).host;
  const d = {
    name: firstName(appointment.patient_name),
    ref: appointment.reference,
    service: appointment.service_name,
    when: `${shortDate(appointment.appointment_date)} ${formatDisplayTime(appointment.time_slot)}`,
    branch: shortBranch(appointment.branch_name),
    phone: localPhone(appointment.branch_phone),
    reviewLink: `${host}/r/${appointment.branch_id}`,
  };
  const variants = {
    booked: [
      `Hi ${d.name}, ABI Skin Clinic got your request ${d.ref}: ${d.service}, ${d.when}, ${d.branch}. We will confirm soon.`,
      `Hi ${d.name}, ABI Skin Clinic got your request ${d.ref} for ${d.when}, ${d.branch}. We will confirm soon.`,
    ],
    confirmed: [
      `Hi ${d.name}, your ABI Skin Clinic visit is CONFIRMED: ${d.service}, ${d.when}, ${d.branch}. Ref ${d.ref}. Call ${d.phone} to change.`,
      `Hi ${d.name}, your ABI Skin Clinic visit is CONFIRMED: ${d.when}, ${d.branch}. Ref ${d.ref}. Call ${d.phone} to change.`,
    ],
    rejected: [
      `Hi ${d.name}, sorry, ABI Skin Clinic cannot take your ${d.when} slot (${d.ref}). Call ${d.phone} or rebook at ${host}`,
      `Hi ${d.name}, sorry, ABI Skin Clinic cannot take your ${d.when} slot. Call ${d.phone} or rebook at ${host}`,
    ],
    cancelled: [
      `Hi ${d.name}, your ABI Skin Clinic visit ${d.ref} on ${d.when} is cancelled. Call ${d.phone} or rebook at ${host}`,
      `Hi ${d.name}, your ABI Skin Clinic visit on ${d.when} is cancelled. Call ${d.phone} or rebook at ${host}`,
    ],
    completed: [
      `Hi ${d.name}, thank you for visiting ABI Skin Clinic ${d.branch}. Please rate us on Google: ${d.reviewLink}`,
      `Hi ${d.name}, thank you for visiting ABI Skin Clinic. Please rate us on Google: ${d.reviewLink}`,
    ],
  }[event];
  if (!variants) return null;
  return variants.find((message) => message.length <= SMS_LIMIT && isGsm7(message)) || variants[variants.length - 1];
}

export function testSmsMessage() {
  return 'ABI Skin Clinic: test SMS from ABI Doctor. Automatic patient SMS is working on this phone.';
}

export async function getSmsSender(db) {
  return db.prepare(`
    SELECT id, phone, device_name, push_token, daily_limit, registered_at, last_seen_at
    FROM sms_sender ORDER BY registered_at DESC LIMIT 1
  `).first();
}

function utcTimestamp(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

/** SMS handed to the phone since midnight in the clinic's timezone. */
export async function countSmsToday(db, now = new Date()) {
  const today = getZonedNow('Asia/Kolkata', now).date;
  const since = utcTimestamp(new Date(`${today}T00:00:00+05:30`));
  const row = await db.prepare(`
    SELECT COUNT(*) AS count FROM patient_notifications
    WHERE channel = 'sms' AND status != 'failed' AND created_at >= ?
  `).bind(since).first();
  return Number(row?.count || 0);
}

async function insertSms(db, { appointmentId, event, phone, message, status = 'queued', error = null }) {
  const id = crypto.randomUUID();
  await db.prepare(`
    INSERT INTO patient_notifications (id, appointment_id, event, channel, status, phone, message, error)
    VALUES (?, ?, ?, 'sms', ?, ?, ?, ?)
  `).bind(id, appointmentId, event, status, phone, message, error).run();
  return id;
}

/**
 * Queues an SMS for the registered clinic phone and wakes it through Firebase.
 * Returns { queued, skipped, error, duplicate } and never throws for delivery problems.
 */
export async function queueSms(env, { appointmentId = null, event, phone, message, force = false }) {
  const db = env.DB;
  const sender = await getSmsSender(db);
  if (!sender || !message) return { queued: false, skipped: true };
  if (!force && appointmentId && await alreadyNotified(db, appointmentId, event, 'sms')) {
    return { queued: false, skipped: true, duplicate: true };
  }
  const recipient = `+91${localPhone(phone)}`;
  if (await countSmsToday(db) >= sender.daily_limit) {
    const error = `Daily SMS limit of ${sender.daily_limit} reached. Send manually or raise the limit.`;
    await insertSms(db, { appointmentId, event, phone: recipient, message, status: 'failed', error });
    return { queued: false, skipped: false, error };
  }
  await insertSms(db, { appointmentId, event, phone: recipient, message });
  await sendSmsWakeUp(env, sender.push_token)
    .catch((wakeError) => console.error('SMS wake-up failed.', wakeError.message));
  return { queued: true, skipped: false };
}

export async function queuePatientSms(env, appointment, event, origin, options = {}) {
  return queueSms(env, {
    appointmentId: appointment.id,
    event,
    phone: appointment.phone,
    message: buildSmsMessage(event, appointment, origin),
    force: options.force,
  });
}

/** Authenticates the clinic phone by the secret it received at registration. */
export async function requireSmsSender(db, request) {
  const header = request.headers.get('authorization') || '';
  const secret = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (secret.length < 32) throw new ApiError(401, 'SENDER_UNAUTHORIZED', 'This phone is not registered to send SMS.');
  const sender = await db.prepare('SELECT id, daily_limit FROM sms_sender WHERE secret_hash = ?')
    .bind(await hashText(secret)).first();
  if (!sender) throw new ApiError(401, 'SENDER_UNAUTHORIZED', 'This phone is not registered to send SMS.');
  await db.prepare('UPDATE sms_sender SET last_seen_at = ? WHERE id = ?')
    .bind(utcTimestamp(new Date()), sender.id).run();
  return sender;
}

/** Hands queued SMS to the phone, marking them "sending" so they are not sent twice. */
export async function claimSmsJobs(db, limit = 10) {
  const staleBefore = utcTimestamp(new Date(Date.now() - STALE_SENDING_MINUTES * 60_000));
  const now = utcTimestamp(new Date());
  await db.prepare(`
    UPDATE patient_notifications SET status = 'failed', error = 'Phone did not confirm sending after 3 attempts.', updated_at = ?
    WHERE channel = 'sms' AND status = 'sending' AND updated_at < ? AND attempts >= ?
  `).bind(now, staleBefore, MAX_ATTEMPTS).run();
  const jobs = await db.prepare(`
    SELECT id, phone, message FROM patient_notifications
    WHERE channel = 'sms' AND (status = 'queued' OR (status = 'sending' AND updated_at < ?))
    ORDER BY created_at LIMIT ?
  `).bind(staleBefore, limit).all();
  const rows = jobs.results || [];
  if (rows.length) {
    await db.batch(rows.map((job) => db.prepare(`
      UPDATE patient_notifications SET status = 'sending', attempts = attempts + 1, updated_at = ?
      WHERE id = ?
    `).bind(now, job.id)));
  }
  return rows;
}

const PHONE_REPORTED = ['sent', 'delivered', 'failed'];

export async function reportSmsJob(db, jobId, status, error) {
  if (!PHONE_REPORTED.includes(status)) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Status must be sent, delivered or failed.');
  }
  // A delivery report never downgrades, and a late "sent" never overwrites "delivered".
  const result = await db.prepare(`
    UPDATE patient_notifications SET status = ?, error = ?, updated_at = ?
    WHERE id = ? AND channel = 'sms'
      AND NOT (status = 'delivered' AND ? != 'delivered')
  `).bind(status, status === 'failed' ? String(error || 'Phone could not send the SMS.').slice(0, 300) : null,
    utcTimestamp(new Date()), jobId, status).run();
  return result.meta.changes > 0;
}
