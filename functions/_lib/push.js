import { formatDisplayDate, formatDisplayTime } from './patient-messages.js';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';

function base64Url(value) {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : new Uint8Array(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function privateKeyBytes(pem) {
  const body = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '');
  const binary = atob(body);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function getAccessToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64Url(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: FCM_SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  }));
  const unsignedToken = `${header}.${claims}`;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyBytes(serviceAccount.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(unsignedToken),
  );
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsignedToken}.${base64Url(signature)}`,
    }),
  });
  if (!response.ok) throw new Error('Firebase authentication failed.');
  return (await response.json()).access_token;
}

async function sendFirebaseMessages(env, messages) {
  const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
  const accessToken = await getAccessToken(serviceAccount);
  const endpoint = `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`;
  return Promise.all(messages.map(async (message) => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });
    return { token: message.token, response };
  }));
}

/**
 * Silent, high-priority data message telling the registered clinic phone that SMS jobs
 * are waiting. It carries no patient details; the phone fetches them over HTTPS.
 */
export async function sendSmsWakeUp(env, token) {
  if (!env.FIREBASE_SERVICE_ACCOUNT_JSON || !token) return false;
  const [{ response }] = await sendFirebaseMessages(env, [{
    token,
    data: { type: 'sms_jobs' },
    android: { priority: 'high', ttl: '3600s' },
  }]);
  if (!response.ok) console.error('SMS wake-up delivery failed.', response.status);
  return response.ok;
}

/** Branch, day and time of a new request. Patient details stay in the app, not in the push. */
export function appointmentAlertText(branchName, appointmentDate, timeSlot) {
  if (!appointmentDate || !timeSlot) return 'Open ABI Doctor to review the latest request.';
  const when = `${formatDisplayDate(appointmentDate)} · ${formatDisplayTime(timeSlot)}`;
  return branchName ? `${branchName} · ${when}` : when;
}

/** Firebase message for one doctor device, in the alert style that device registered. */
export function appointmentAlertMessage(token, alertStyle, appointmentId, body) {
  const title = 'New appointment request';
  if (alertStyle === 'ring') {
    // Data-only, so ABI Doctor handles it itself and rings until the doctor responds. A late
    // ring is pointless, so it expires after 15 minutes if the phone stays offline.
    return {
      token,
      data: { type: 'appointment_request', appointmentId: appointmentId || '', title, body },
      android: { priority: 'high', ttl: '900s' },
    };
  }
  return {
    token,
    notification: { title, body },
    android: { priority: 'high', notification: { channel_id: 'appointments' } },
    data: { route: '/admin' },
  };
}

export async function sendNewAppointmentNotification(env, { appointmentId, branchId, appointmentDate, timeSlot } = {}) {
  if (!env.FIREBASE_SERVICE_ACCOUNT_JSON) return;
  const devices = await env.DB.prepare(`
    SELECT token, alert_style FROM doctor_devices ORDER BY updated_at DESC LIMIT 20
  `).all();
  if (!devices.results?.length) return;
  const branch = branchId
    ? await env.DB.prepare('SELECT name FROM branches WHERE id = ?').bind(branchId).first()
    : null;
  const body = appointmentAlertText(branch?.name, appointmentDate, timeSlot);
  const results = await sendFirebaseMessages(env, devices.results.map(({ token, alert_style: alertStyle }) => (
    appointmentAlertMessage(token, alertStyle, appointmentId, body)
  )));
  await Promise.all(results.map(async ({ token, response }) => {
    if (response.status === 404) {
      // The app was uninstalled or the token rotated; stop sending to it.
      await env.DB.prepare('DELETE FROM doctor_devices WHERE token = ?').bind(token).run();
    } else if (!response.ok) {
      console.error('Firebase notification delivery failed.', response.status);
    }
  }));
}
