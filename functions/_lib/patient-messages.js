const CLINIC_NAME = 'ABI Skin & Hair Clinic';
const AUTOMATIC_EVENTS = ['booked', 'confirmed', 'cancelled', 'completed'];

// Approved WhatsApp templates. Parameter order must match the {{n}} placeholders
// documented in NOTIFICATIONS.md.
const TEMPLATES = {
  booked: 'appointment_received',
  confirmed: 'appointment_confirmed',
  cancelled: 'appointment_cancelled',
  completed: 'appointment_review',
};

export function eventForStatus(status) {
  if (status === 'requested') return 'booked';
  if (['confirmed', 'cancelled', 'completed', 'no_show'].includes(status)) return status;
  return null;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDisplayDate(value) {
  const date = new Date(`${value}T00:00:00Z`);
  return `${WEEKDAYS[date.getUTCDay()]}, ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function formatDisplayTime(value) {
  const [hourText, minute] = String(value).split(':');
  const hour = Number(hourText);
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`;
}

/** The branch's Google review link, or its Google Maps listing when none is configured. */
export function googleReviewLink(branch) {
  if (branch.google_review_url) return branch.google_review_url;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${branch.name}, ${branch.address}`)}`;
}

/** Google review link for an appointment row joined with its branch. */
export function branchReviewLink(appointment) {
  return googleReviewLink({
    google_review_url: appointment.google_review_url,
    name: appointment.branch_name,
    address: appointment.branch_address,
  });
}

export function reviewUrl(origin, token) {
  return token ? `${origin}/?review=${token}#reviews` : null;
}

function details(appointment, origin) {
  return {
    name: appointment.patient_name,
    reference: appointment.reference,
    branch: appointment.branch_name,
    address: appointment.branch_address,
    clinicPhone: appointment.branch_phone,
    service: appointment.service_name,
    date: formatDisplayDate(appointment.appointment_date),
    time: formatDisplayTime(appointment.time_slot),
    trackUrl: `${origin}/#track`,
    bookUrl: `${origin}/#book`,
    googleReviewUrl: branchReviewLink(appointment),
  };
}

function templateParameters(event, d) {
  if (event === 'booked') return [d.name, d.branch, d.service, d.date, d.time, d.reference];
  if (event === 'confirmed') return [d.name, d.branch, d.date, d.time, d.reference, d.clinicPhone];
  if (event === 'cancelled') return [d.name, d.reference, d.date, d.time, d.clinicPhone];
  if (event === 'completed') return [d.name, d.branch, d.googleReviewUrl];
  return [];
}

/** Plain-text message used for manual WhatsApp/SMS sending from the doctor app. */
export function buildPatientMessage(event, appointment, origin) {
  const d = details(appointment, origin);
  switch (event) {
    case 'booked':
      return `Hello ${d.name}, we have received your appointment request at ${d.branch} for ${d.service} on ${d.date} at ${d.time}. Reference: ${d.reference}. The clinic will confirm it shortly. Track status: ${d.trackUrl} - ${CLINIC_NAME}`;
    case 'confirmed':
      return `Hello ${d.name}, your appointment at ${d.branch} on ${d.date} at ${d.time} is CONFIRMED. Reference: ${d.reference}. Address: ${d.address}. To reschedule, call ${d.clinicPhone}. - ${CLINIC_NAME}`;
    case 'cancelled':
      return `Hello ${d.name}, your appointment ${d.reference} on ${d.date} at ${d.time} has been cancelled. Please call ${d.clinicPhone} or book a new time at ${d.bookUrl} - ${CLINIC_NAME}`;
    case 'completed':
      return `Thank you for visiting ${d.branch}, ${d.name}. Please share your experience on Google: ${d.googleReviewUrl} - ${CLINIC_NAME}`;
    case 'no_show':
      return `Hello ${d.name}, we missed you for your appointment ${d.reference} on ${d.date} at ${d.time}. Please call ${d.clinicPhone} or book again at ${d.bookUrl} - ${CLINIC_NAME}`;
    default:
      return null;
  }
}

export function isWhatsAppConfigured(env) {
  return Boolean(env.WHATSAPP_ACCESS_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID);
}

export async function loadAppointmentForMessage(db, appointmentId) {
  return db.prepare(`
    SELECT a.id, a.reference, a.patient_name, a.phone, a.appointment_date, a.time_slot,
      a.status, a.review_token, b.name AS branch_name, b.address AS branch_address,
      b.phone AS branch_phone, b.google_review_url, s.name AS service_name
    FROM appointments a
    JOIN branches b ON b.id = a.branch_id
    JOIN services s ON s.id = a.service_id
    WHERE a.id = ?
  `).bind(appointmentId).first();
}

async function recordNotification(db, appointmentId, event, status, providerMessageId, error) {
  await db.prepare(`
    INSERT INTO patient_notifications (
      id, appointment_id, event, channel, status, provider_message_id, error
    ) VALUES (?, ?, ?, 'whatsapp', ?, ?, ?)
  `).bind(crypto.randomUUID(), appointmentId, event, status, providerMessageId, error).run();
}

/**
 * Sends an approved WhatsApp template to the patient through the WhatsApp Cloud API.
 * Returns { sent, skipped, error } and never throws for delivery problems.
 */
export async function sendPatientWhatsApp(env, appointment, event, origin, fetchImpl = fetch) {
  if (!isWhatsAppConfigured(env)) return { sent: false, skipped: true };
  if (!AUTOMATIC_EVENTS.includes(event)) return { sent: false, skipped: true };
  const parameters = templateParameters(event, details(appointment, origin));
  if (parameters.some((value) => !value)) return { sent: false, skipped: true };

  const version = env.WHATSAPP_GRAPH_VERSION || 'v23.0';
  let messageId = null;
  let error = null;
  try {
    const response = await fetchImpl(`https://graph.facebook.com/${version}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: `91${appointment.phone}`,
        type: 'template',
        template: {
          name: TEMPLATES[event],
          language: { code: env.WHATSAPP_TEMPLATE_LANGUAGE || 'en' },
          components: [{
            type: 'body',
            parameters: parameters.map((value) => ({ type: 'text', text: String(value) })),
          }],
        },
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (response.ok) messageId = payload.messages?.[0]?.id || null;
    else error = (payload.error?.message || `WhatsApp API returned ${response.status}`).slice(0, 300);
  } catch (requestError) {
    error = (requestError instanceof Error ? requestError.message : String(requestError)).slice(0, 300);
  }

  if (env.DB) {
    await recordNotification(env.DB, appointment.id, event, error ? 'failed' : 'sent', messageId, error)
      .catch((logError) => console.error('Could not record patient notification.', logError.message));
  }
  if (error) console.error(JSON.stringify({ message: 'Patient WhatsApp failed', appointmentId: appointment.id, event, error }));
  return { sent: !error, skipped: false, error };
}
