import { ApiError, errorResponse, json, methodNotAllowed, readJson, requireSameOrigin } from '../_lib/http.js';
import { clearSessionCookie, createSession, destroySession, requireAdmin, verifySecret } from '../_lib/auth.js';
import { enforceRateLimit, isUniqueConstraintError, writeAudit } from '../_lib/database.js';
import { getAvailability, getZonedNow, timeToMinutes } from '../_lib/schedule.js';
import { sendNewAppointmentNotification } from '../_lib/push.js';
import {
  date as validateDate,
  id as validateId,
  integer,
  oneOf,
  phone as validatePhone,
  text,
  time as validateTime,
} from '../_lib/validation.js';

const APPOINTMENT_STATUSES = ['requested', 'confirmed', 'completed', 'cancelled', 'no_show'];
const REVIEW_STATUSES = ['pending', 'approved', 'rejected'];

function routePath(request) {
  return new URL(request.url).pathname.replace(/^\/api\/?/, '').replace(/\/$/, '');
}

function isMutation(method) {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
}

async function publicBootstrap(db) {
  const [branchResult, serviceResult, reviewResult, ratingResult] = await db.batch([
    db.prepare(`
      SELECT id, name, address, phone, timezone
      FROM branches WHERE active = 1 ORDER BY name
    `),
    db.prepare(`
      SELECT id, name FROM services WHERE active = 1 ORDER BY sort_order, name
    `),
    db.prepare(`
      SELECT id, patient_name, rating, comment, created_at
      FROM reviews WHERE status = 'approved'
      ORDER BY moderated_at DESC, created_at DESC LIMIT 12
    `),
    db.prepare(`
      SELECT ROUND(AVG(rating), 1) AS average, COUNT(*) AS count
      FROM reviews WHERE status = 'approved'
    `),
  ]);
  return {
    branches: branchResult.results || [],
    services: serviceResult.results || [],
    reviews: reviewResult.results || [],
    rating: ratingResult.results?.[0] || { average: null, count: 0 },
  };
}

async function createAppointment(context) {
  const { DB } = context.env;
  await enforceRateLimit(DB, context.request, 'appointment', 8, 60 * 60);
  const body = await readJson(context.request);
  const branchId = validateId(body.branchId, 'Branch');
  const serviceId = validateId(body.serviceId, 'Service');
  const appointmentDate = validateDate(body.date, 'Appointment date');
  const timeSlot = validateTime(body.timeSlot, 'Time slot');
  const patientName = text(body.name, 'Patient name', { min: 2, max: 100 });
  const phone = validatePhone(body.phone);
  const notes = text(body.notes, 'Notes', { max: 500, optional: true });
  if (body.consent !== true) {
    throw new ApiError(400, 'CONSENT_REQUIRED', 'Consent is required to store an appointment request.');
  }

  const service = await DB
    .prepare('SELECT id, name FROM services WHERE id = ? AND active = 1')
    .bind(serviceId)
    .first();
  if (!service) throw new ApiError(404, 'SERVICE_NOT_FOUND', 'Selected service was not found.');

  const availability = await getAvailability(DB, branchId, appointmentDate);
  if (!availability.slots.includes(timeSlot)) {
    throw new ApiError(409, 'SLOT_UNAVAILABLE', 'That time slot is no longer available. Please choose another slot.');
  }

  const appointmentId = crypto.randomUUID();
  const reference = `ABI-${appointmentDate.replaceAll('-', '')}-${appointmentId.slice(0, 6).toUpperCase()}`;
  try {
    await DB.prepare(`
      INSERT INTO appointments (
        id, reference, branch_id, service_id, appointment_date, time_slot,
        patient_name, phone, notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'requested')
    `).bind(
      appointmentId,
      reference,
      branchId,
      serviceId,
      appointmentDate,
      timeSlot,
      patientName,
      phone,
      notes,
    ).run();
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new ApiError(409, 'SLOT_UNAVAILABLE', 'That time slot was just booked. Please choose another slot.');
    }
    throw error;
  }

  console.log(JSON.stringify({
    message: 'Appointment requested',
    appointmentId,
    reference,
    branchId,
    appointmentDate,
    timeSlot,
  }));
  const notificationTask = sendNewAppointmentNotification(context.env)
    .catch((error) => console.error('Appointment push notification failed.', error.message));
  if (typeof context.waitUntil === 'function') context.waitUntil(notificationTask);
  return json({
    appointment: {
      id: appointmentId,
      reference,
      branchId,
      service: service.name,
      date: appointmentDate,
      timeSlot,
      status: 'requested',
    },
    message: 'Your appointment request is stored and awaiting clinic confirmation.',
  }, 201);
}

async function submitReview(context) {
  const { DB } = context.env;
  await enforceRateLimit(DB, context.request, 'review', 5, 60 * 60);
  const body = await readJson(context.request);
  const token = text(body.token, 'Review invitation token', { min: 20, max: 100 });
  const patientName = text(body.name, 'Display name', { min: 2, max: 80 });
  const rating = integer(body.rating, 'Rating', { min: 1, max: 5 });
  const comment = text(body.comment, 'Review', { min: 20, max: 800 });
  if (body.consent !== true) {
    throw new ApiError(400, 'CONSENT_REQUIRED', 'Consent is required to publish a review.');
  }

  const appointment = await DB.prepare(`
    SELECT id FROM appointments
    WHERE review_token = ? AND status = 'completed'
  `).bind(token).first();
  if (!appointment) {
    throw new ApiError(404, 'INVALID_REVIEW_INVITE', 'This review invitation is invalid or not ready yet.');
  }

  try {
    await DB.prepare(`
      INSERT INTO reviews (
        id, appointment_id, patient_name, rating, comment, consent, status
      ) VALUES (?, ?, ?, ?, ?, 1, 'pending')
    `).bind(crypto.randomUUID(), appointment.id, patientName, rating, comment).run();
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new ApiError(409, 'REVIEW_ALREADY_SUBMITTED', 'A review has already been submitted for this appointment.');
    }
    throw error;
  }

  return json({ message: 'Thank you. Your review was submitted for moderation.' }, 201);
}

async function login(context) {
  const { DB, ADMIN_PASSWORD } = context.env;
  await enforceRateLimit(DB, context.request, 'admin-login', 5, 15 * 60);
  if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12) {
    throw new ApiError(503, 'ADMIN_NOT_CONFIGURED', 'Admin login is not configured. Set the ADMIN_PASSWORD Cloudflare secret.');
  }
  const body = await readJson(context.request, 2_048);
  const password = text(body.password, 'Password', { min: 1, max: 256 });
  if (!(await verifySecret(password, ADMIN_PASSWORD))) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Incorrect password.');
  }
  const cookie = await createSession(DB, context.request);
  await writeAudit(DB, 'admin.login', 'session');
  return json({ authenticated: true }, 200, { 'Set-Cookie': cookie });
}

async function dashboard(db) {
  const today = getZonedNow().date;
  const [statsResult, recentResult, leavesResult, pendingReviewsResult] = await db.batch([
    db.prepare(`
      SELECT
        SUM(CASE WHEN appointment_date = ? AND status IN ('requested', 'confirmed') THEN 1 ELSE 0 END) AS today,
        SUM(CASE WHEN status = 'requested' THEN 1 ELSE 0 END) AS requested,
        SUM(CASE WHEN appointment_date >= ? AND status = 'confirmed' THEN 1 ELSE 0 END) AS upcoming_confirmed,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed
      FROM appointments
    `).bind(today, today),
    db.prepare(`
      SELECT a.id, a.reference, a.patient_name, a.phone, a.appointment_date,
        a.time_slot, a.status, b.name AS branch_name, s.name AS service_name,
        a.created_at, a.review_token
      FROM appointments a
      JOIN branches b ON b.id = a.branch_id
      JOIN services s ON s.id = a.service_id
      ORDER BY a.created_at DESC LIMIT 12
    `),
    db.prepare(`
      SELECT l.id, l.leave_date, l.reason, l.branch_id, b.name AS branch_name
      FROM leave_days l LEFT JOIN branches b ON b.id = l.branch_id
      WHERE l.leave_date >= ? ORDER BY l.leave_date LIMIT 12
    `).bind(today),
    db.prepare("SELECT COUNT(*) AS count FROM reviews WHERE status = 'pending'"),
  ]);
  return {
    stats: {
      today: Number(statsResult.results?.[0]?.today || 0),
      requested: Number(statsResult.results?.[0]?.requested || 0),
      upcomingConfirmed: Number(statsResult.results?.[0]?.upcoming_confirmed || 0),
      completed: Number(statsResult.results?.[0]?.completed || 0),
      pendingReviews: Number(pendingReviewsResult.results?.[0]?.count || 0),
    },
    recentAppointments: recentResult.results || [],
    upcomingLeaves: leavesResult.results || [],
  };
}

async function listAppointments(db, request) {
  const url = new URL(request.url);
  const conditions = [];
  const params = [];
  const status = url.searchParams.get('status');
  const branch = url.searchParams.get('branch');
  const date = url.searchParams.get('date');
  const search = url.searchParams.get('search')?.trim();
  if (status) {
    conditions.push('a.status = ?');
    params.push(oneOf(status, APPOINTMENT_STATUSES, 'Status'));
  }
  if (branch) {
    conditions.push('a.branch_id = ?');
    params.push(validateId(branch, 'Branch'));
  }
  if (date) {
    conditions.push('a.appointment_date = ?');
    params.push(validateDate(date));
  }
  if (search) {
    conditions.push('(a.reference LIKE ? OR a.patient_name LIKE ? OR a.phone LIKE ?)');
    const term = `%${search.slice(0, 80)}%`;
    params.push(term, term, term);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await db.prepare(`
    SELECT a.*, b.name AS branch_name, s.name AS service_name
    FROM appointments a
    JOIN branches b ON b.id = a.branch_id
    JOIN services s ON s.id = a.service_id
    ${where}
    ORDER BY a.appointment_date DESC, a.time_slot DESC
    LIMIT 200
  `).bind(...params).all();
  const origin = new URL(request.url).origin;
  return (result.results || []).map((appointment) => ({
    ...appointment,
    review_url: appointment.review_token
      ? `${origin}/?review=${appointment.review_token}#reviews`
      : null,
  }));
}

async function updateAppointment(context, appointmentId) {
  const body = await readJson(context.request);
  const status = oneOf(body.status, APPOINTMENT_STATUSES, 'Appointment status');
  const adminNotes = text(body.adminNotes, 'Admin notes', { max: 500, optional: true });
  const existing = await context.env.DB
    .prepare('SELECT id, review_token FROM appointments WHERE id = ?')
    .bind(appointmentId)
    .first();
  if (!existing) throw new ApiError(404, 'APPOINTMENT_NOT_FOUND', 'Appointment was not found.');
  const reviewToken = status === 'completed' && !existing.review_token
    ? crypto.randomUUID()
    : existing.review_token;
  try {
    await context.env.DB.prepare(`
      UPDATE appointments SET status = ?, admin_notes = ?, review_token = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(status, adminNotes, reviewToken || null, appointmentId).run();
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new ApiError(409, 'SLOT_UNAVAILABLE', 'Another active appointment already occupies that slot.');
    }
    throw error;
  }
  await writeAudit(context.env.DB, 'appointment.status_updated', 'appointment', appointmentId, { status });
  const updated = await context.env.DB.prepare(`
    SELECT a.*, b.name AS branch_name, s.name AS service_name
    FROM appointments a
    JOIN branches b ON b.id = a.branch_id
    JOIN services s ON s.id = a.service_id
    WHERE a.id = ?
  `).bind(appointmentId).first();
  return {
    ...updated,
    review_url: reviewToken ? `${new URL(context.request.url).origin}/?review=${reviewToken}#reviews` : null,
  };
}

async function getSchedule(db) {
  const [branchesResult, hoursResult, servicesResult] = await db.batch([
    db.prepare('SELECT id, name, address, phone, timezone, active FROM branches ORDER BY name'),
    db.prepare(`
      SELECT id, branch_id, day_of_week, period_index, start_time, end_time, slot_minutes, active
      FROM working_hours ORDER BY branch_id, day_of_week, period_index
    `),
    db.prepare('SELECT id, name, active, sort_order FROM services ORDER BY sort_order, name'),
  ]);
  return {
    branches: branchesResult.results || [],
    hours: hoursResult.results || [],
    services: servicesResult.results || [],
  };
}

function validateSchedulePeriods(rawPeriods) {
  if (!Array.isArray(rawPeriods) || rawPeriods.length > 56) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Schedule periods must be an array with at most 56 entries.');
  }
  const byDay = new Map();
  for (const raw of rawPeriods) {
    const dayOfWeek = integer(raw.dayOfWeek, 'Day of week', { min: 0, max: 6 });
    const startTime = validateTime(raw.startTime, 'Start time');
    const endTime = validateTime(raw.endTime, 'End time');
    const slotMinutes = integer(raw.slotMinutes ?? 30, 'Slot duration', { min: 10, max: 120 });
    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Working period end time must be after its start time.');
    }
    const periods = byDay.get(dayOfWeek) || [];
    periods.push({ dayOfWeek, startTime, endTime, slotMinutes });
    byDay.set(dayOfWeek, periods);
  }

  const normalized = [];
  for (const periods of byDay.values()) {
    periods.sort((left, right) => left.startTime.localeCompare(right.startTime));
    for (let index = 0; index < periods.length; index += 1) {
      if (index > 0 && timeToMinutes(periods[index].startTime) < timeToMinutes(periods[index - 1].endTime)) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Working periods on the same day cannot overlap.');
      }
      normalized.push({ ...periods[index], periodIndex: index });
    }
  }
  return normalized;
}

async function replaceSchedule(context, branchId) {
  const branch = await context.env.DB.prepare('SELECT id FROM branches WHERE id = ?').bind(branchId).first();
  if (!branch) throw new ApiError(404, 'BRANCH_NOT_FOUND', 'Clinic branch was not found.');
  const body = await readJson(context.request);
  const periods = validateSchedulePeriods(body.periods);
  const statements = [
    context.env.DB.prepare('DELETE FROM working_hours WHERE branch_id = ?').bind(branchId),
    ...periods.map((period) => context.env.DB.prepare(`
      INSERT INTO working_hours (
        branch_id, day_of_week, period_index, start_time, end_time, slot_minutes, active
      ) VALUES (?, ?, ?, ?, ?, ?, 1)
    `).bind(
      branchId,
      period.dayOfWeek,
      period.periodIndex,
      period.startTime,
      period.endTime,
      period.slotMinutes,
    )),
  ];
  await context.env.DB.batch(statements);
  await writeAudit(context.env.DB, 'schedule.replaced', 'branch', branchId, { periodCount: periods.length });
}

async function listLeaves(db) {
  const result = await db.prepare(`
    SELECT l.id, l.leave_date, l.reason, l.branch_id, b.name AS branch_name
    FROM leave_days l LEFT JOIN branches b ON b.id = l.branch_id
    ORDER BY l.leave_date DESC LIMIT 200
  `).all();
  return result.results || [];
}

async function createLeave(context) {
  const body = await readJson(context.request);
  const leaveDate = validateDate(body.date, 'Leave date');
  const reason = text(body.reason, 'Reason', { min: 2, max: 200 });
  const branchId = body.branchId ? validateId(body.branchId, 'Branch') : null;
  if (branchId) {
    const branch = await context.env.DB.prepare('SELECT id FROM branches WHERE id = ?').bind(branchId).first();
    if (!branch) throw new ApiError(404, 'BRANCH_NOT_FOUND', 'Clinic branch was not found.');
  }
  const duplicate = await context.env.DB.prepare(`
    SELECT id FROM leave_days
    WHERE leave_date = ? AND (branch_id = ? OR (? IS NULL AND branch_id IS NULL))
  `).bind(leaveDate, branchId, branchId).first();
  if (duplicate) throw new ApiError(409, 'LEAVE_EXISTS', 'A leave entry already exists for that date and branch.');
  const leaveId = crypto.randomUUID();
  await context.env.DB.prepare(`
    INSERT INTO leave_days (id, branch_id, leave_date, reason) VALUES (?, ?, ?, ?)
  `).bind(leaveId, branchId, leaveDate, reason).run();
  await writeAudit(context.env.DB, 'leave.created', 'leave', leaveId, { branchId, leaveDate });
  return leaveId;
}

async function listReviews(db, request) {
  const statusParam = new URL(request.url).searchParams.get('status');
  const status = statusParam ? oneOf(statusParam, REVIEW_STATUSES, 'Review status') : null;
  const result = status
    ? await db.prepare(`
        SELECT r.*, a.reference FROM reviews r
        JOIN appointments a ON a.id = r.appointment_id
        WHERE r.status = ? ORDER BY r.created_at DESC LIMIT 200
      `).bind(status).all()
    : await db.prepare(`
        SELECT r.*, a.reference FROM reviews r
        JOIN appointments a ON a.id = r.appointment_id
        ORDER BY r.created_at DESC LIMIT 200
      `).all();
  return result.results || [];
}

async function checkAppointmentStatus(context) {
  const { DB } = context.env;
  await enforceRateLimit(DB, context.request, 'appointment-status', 15, 10 * 60);
  const url = new URL(context.request.url);
  const rawReference = url.searchParams.get('reference');
  const rawPhone = url.searchParams.get('phone');
  if (!rawReference || !rawPhone) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Reference number and registered mobile number are required.');
  }
  const reference = text(rawReference.trim().toUpperCase(), 'Reference number', { min: 4, max: 40 });
  const phone = validatePhone(rawPhone);

  const appointment = await DB.prepare(`
    SELECT a.id, a.reference, a.appointment_date, a.time_slot, a.patient_name,
           a.status, a.notes, a.admin_notes, a.review_token, a.created_at,
           b.name AS branch_name, b.phone AS branch_phone, b.address AS branch_address,
           s.name AS service_name
    FROM appointments a
    JOIN branches b ON b.id = a.branch_id
    JOIN services s ON s.id = a.service_id
    WHERE a.reference = ? AND a.phone = ?
  `).bind(reference, phone).first();

  if (!appointment) {
    throw new ApiError(404, 'APPOINTMENT_NOT_FOUND', 'No appointment found matching this reference and mobile number.');
  }

  return json({
    appointment: {
      reference: appointment.reference,
      date: appointment.appointment_date,
      timeSlot: appointment.time_slot,
      patientName: appointment.patient_name,
      status: appointment.status,
      branchName: appointment.branch_name,
      branchPhone: appointment.branch_phone,
      branchAddress: appointment.branch_address,
      serviceName: appointment.service_name,
      notes: appointment.notes,
      adminNotes: appointment.admin_notes,
      reviewToken: appointment.status === 'completed' ? appointment.review_token : null,
      createdAt: appointment.created_at,
    },
  });
}

async function getSettings(db) {
  const result = await db.prepare('SELECT key, value, updated_at FROM settings').all();
  const settings = {};
  for (const row of result.results || []) {
    settings[row.key] = row.value;
  }
  return settings;
}

async function updateSettings(context) {
  const { DB } = context.env;
  const body = await readJson(context.request);
  const statements = [];
  const changes = {};

  if (body.bookingHorizonDays !== undefined) {
    const horizon = integer(body.bookingHorizonDays, 'Booking horizon days', { min: 1, max: 365 });
    statements.push(DB.prepare("UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = 'booking_horizon_days'").bind(String(horizon)));
    changes.bookingHorizonDays = horizon;
  }
  if (body.minimumNoticeMinutes !== undefined) {
    const notice = integer(body.minimumNoticeMinutes, 'Minimum booking notice minutes', { min: 0, max: 1440 });
    statements.push(DB.prepare("UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = 'minimum_booking_notice_minutes'").bind(String(notice)));
    changes.minimumNoticeMinutes = notice;
  }
  if (body.clinicTimezone !== undefined) {
    const tz = text(body.clinicTimezone, 'Clinic timezone', { min: 3, max: 50 });
    statements.push(DB.prepare("UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = 'clinic_timezone'").bind(tz));
    changes.clinicTimezone = tz;
  }

  if (statements.length) {
    await DB.batch(statements);
    await writeAudit(DB, 'settings.updated', 'settings', null, changes);
  }
  return getSettings(DB);
}

async function createService(context) {
  const body = await readJson(context.request);
  const serviceId = validateId(body.id, 'Service ID');
  const serviceName = text(body.name, 'Service Name', { min: 2, max: 100 });
  const sortOrder = integer(body.sortOrder ?? 0, 'Sort Order', { min: 0, max: 999 });

  const existing = await context.env.DB.prepare('SELECT id FROM services WHERE id = ?').bind(serviceId).first();
  if (existing) {
    throw new ApiError(409, 'SERVICE_EXISTS', 'A service with this ID already exists.');
  }

  await context.env.DB.prepare(`
    INSERT INTO services (id, name, sort_order, active) VALUES (?, ?, ?, 1)
  `).bind(serviceId, serviceName, sortOrder).run();

  await writeAudit(context.env.DB, 'service.created', 'service', serviceId, { name: serviceName, sortOrder });
  return json({ id: serviceId, name: serviceName, sort_order: sortOrder, active: 1 }, 201);
}

async function exportAppointments(db, request) {
  const appointments = await listAppointments(db, request);
  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headers = ['Reference', 'Date', 'Time Slot', 'Patient Name', 'Phone', 'Branch', 'Service', 'Status', 'Notes', 'Admin Notes', 'Created At'];
  const rows = [headers.join(',')];

  for (const app of appointments) {
    rows.push([
      escapeCsv(app.reference),
      escapeCsv(app.appointment_date),
      escapeCsv(app.time_slot),
      escapeCsv(app.patient_name),
      escapeCsv(app.phone),
      escapeCsv(app.branch_name),
      escapeCsv(app.service_name),
      escapeCsv(app.status),
      escapeCsv(app.notes),
      escapeCsv(app.admin_notes),
      escapeCsv(app.created_at),
    ].join(','));
  }

  const csvContent = rows.join('\r\n');
  return new Response(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="abi_clinic_appointments_${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}

async function routePublic(context, path) {
  const method = context.request.method;
  if (path === 'public/bootstrap' && method === 'GET') {
    return json(await publicBootstrap(context.env.DB), 200, { 'Cache-Control': 'public, max-age=60' });
  }
  if (path === 'public/availability' && method === 'GET') {
    const url = new URL(context.request.url);
    return json(await getAvailability(
      context.env.DB,
      url.searchParams.get('branch'),
      url.searchParams.get('date'),
    ));
  }
  if (path === 'public/appointments') {
    return method === 'POST' ? createAppointment(context) : methodNotAllowed(['POST']);
  }
  if (path === 'public/appointments/status' && method === 'GET') {
    return checkAppointmentStatus(context);
  }
  if (path === 'public/reviews') {
    return method === 'POST' ? submitReview(context) : methodNotAllowed(['POST']);
  }
  return null;
}

async function routeAdmin(context, path) {
  const method = context.request.method;
  const { DB } = context.env;
  if (path === 'admin/login') {
    return method === 'POST' ? login(context) : methodNotAllowed(['POST']);
  }
  if (path === 'admin/session' && method === 'GET') {
    try {
      await requireAdmin(DB, context.request);
      return json({ authenticated: true });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return json({ authenticated: false });
      throw error;
    }
  }

  await requireAdmin(DB, context.request);
  if (isMutation(method)) requireSameOrigin(context.request);

  if (path === 'admin/logout') {
    if (method !== 'POST') return methodNotAllowed(['POST']);
    await destroySession(DB, context.request);
    return json({ authenticated: false }, 200, { 'Set-Cookie': clearSessionCookie(context.request) });
  }
  if (path === 'admin/device-tokens') {
    if (method !== 'POST') return methodNotAllowed(['POST']);
    const body = await readJson(context.request);
    const token = text(body.token, 'Device token', { min: 20, max: 4096 });
    const platform = oneOf(body.platform, ['android', 'ios'], 'Platform');
    await DB.prepare(`
      INSERT INTO doctor_devices (token, platform) VALUES (?, ?)
      ON CONFLICT(token) DO UPDATE SET platform = excluded.platform, updated_at = CURRENT_TIMESTAMP
    `).bind(token, platform).run();
    return json({ registered: true });
  }
  if (path === 'admin/dashboard' && method === 'GET') return json(await dashboard(DB));
  if (path === 'admin/appointments' && method === 'GET') return json({ appointments: await listAppointments(DB, context.request) });
  if (path === 'admin/appointments/export' && method === 'GET') return exportAppointments(DB, context.request);

  const appointmentMatch = path.match(/^admin\/appointments\/([a-zA-Z0-9-]+)$/);
  if (appointmentMatch) {
    if (method !== 'PATCH') return methodNotAllowed(['PATCH']);
    return json({ appointment: await updateAppointment(context, appointmentMatch[1]) });
  }

  if (path === 'admin/schedule' && method === 'GET') return json(await getSchedule(DB));
  const scheduleMatch = path.match(/^admin\/schedule\/([a-zA-Z0-9_-]+)$/);
  if (scheduleMatch) {
    if (method !== 'PUT') return methodNotAllowed(['PUT']);
    const branchId = validateId(scheduleMatch[1], 'Branch');
    await replaceSchedule(context, branchId);
    return json({ schedule: await getSchedule(DB) });
  }

  if (path === 'admin/leaves') {
    if (method === 'GET') return json({ leaves: await listLeaves(DB) });
    if (method === 'POST') {
      const leaveId = await createLeave(context);
      return json({ id: leaveId, leaves: await listLeaves(DB) }, 201);
    }
    return methodNotAllowed(['GET', 'POST']);
  }
  const leaveMatch = path.match(/^admin\/leaves\/([a-zA-Z0-9-]+)$/);
  if (leaveMatch) {
    if (method !== 'DELETE') return methodNotAllowed(['DELETE']);
    const result = await DB.prepare('DELETE FROM leave_days WHERE id = ?').bind(leaveMatch[1]).run();
    if (!result.meta.changes) throw new ApiError(404, 'LEAVE_NOT_FOUND', 'Leave entry was not found.');
    await writeAudit(DB, 'leave.deleted', 'leave', leaveMatch[1]);
    return json({ deleted: true });
  }

  if (path === 'admin/reviews' && method === 'GET') {
    return json({ reviews: await listReviews(DB, context.request) });
  }
  const reviewMatch = path.match(/^admin\/reviews\/([a-zA-Z0-9-]+)$/);
  if (reviewMatch) {
    if (method === 'PATCH') {
      const body = await readJson(context.request);
      const status = oneOf(body.status, REVIEW_STATUSES, 'Review status');
      const result = await DB.prepare(`
        UPDATE reviews SET status = ?, moderated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).bind(status, reviewMatch[1]).run();
      if (!result.meta.changes) throw new ApiError(404, 'REVIEW_NOT_FOUND', 'Review was not found.');
      await writeAudit(DB, 'review.moderated', 'review', reviewMatch[1], { status });
      return json({ updated: true });
    }
    if (method === 'DELETE') {
      const result = await DB.prepare('DELETE FROM reviews WHERE id = ?').bind(reviewMatch[1]).run();
      if (!result.meta.changes) throw new ApiError(404, 'REVIEW_NOT_FOUND', 'Review was not found.');
      await writeAudit(DB, 'review.deleted', 'review', reviewMatch[1]);
      return json({ deleted: true });
    }
    return methodNotAllowed(['PATCH', 'DELETE']);
  }

  if (path === 'admin/services') {
    if (method === 'POST') return createService(context);
    return methodNotAllowed(['POST']);
  }
  const serviceMatch = path.match(/^admin\/services\/([a-zA-Z0-9_-]+)$/);
  if (serviceMatch) {
    if (method !== 'PATCH') return methodNotAllowed(['PATCH']);
    const body = await readJson(context.request);
    const updates = [];
    const params = [];
    if (typeof body.active === 'boolean') {
      updates.push('active = ?');
      params.push(body.active ? 1 : 0);
    }
    if (body.name) {
      updates.push('name = ?');
      params.push(text(body.name, 'Service name', { min: 2, max: 100 }));
    }
    if (body.sortOrder !== undefined) {
      updates.push('sort_order = ?');
      params.push(integer(body.sortOrder, 'Sort order', { min: 0, max: 999 }));
    }
    if (!updates.length) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'No valid fields to update.');
    }
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(serviceMatch[1]);
    const result = await DB.prepare(`
      UPDATE services SET ${updates.join(', ')} WHERE id = ?
    `).bind(...params).run();
    if (!result.meta.changes) throw new ApiError(404, 'SERVICE_NOT_FOUND', 'Service was not found.');
    await writeAudit(DB, 'service.updated', 'service', serviceMatch[1], body);
    return json({ updated: true });
  }

  if (path === 'admin/settings') {
    if (method === 'GET') return json({ settings: await getSettings(DB) });
    if (method === 'PATCH') return json({ settings: await updateSettings(context) });
    return methodNotAllowed(['GET', 'PATCH']);
  }

  return null;
}

export async function onRequest(context) {
  try {
    if (context.request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Allow': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    if (!context.env.DB) {
      throw new ApiError(503, 'DATABASE_NOT_CONFIGURED', 'Database binding is not configured.');
    }
    const path = routePath(context.request);
    if (path === 'health' && context.request.method === 'GET') {
      await context.env.DB.prepare('SELECT 1').first();
      return json({ ok: true, database: 'connected', time: new Date().toISOString() });
    }

    let response = null;
    if (path.startsWith('public/')) response = await routePublic(context, path);
    if (!response && path.startsWith('admin/')) response = await routeAdmin(context, path);
    if (!response) throw new ApiError(404, 'NOT_FOUND', 'API route not found.');

    context.waitUntil(
      context.env.DB.prepare('DELETE FROM rate_limits WHERE window_start < ?')
        .bind(Math.floor(Date.now() / 1000) - 86_400)
        .run()
        .catch((error) => console.error(JSON.stringify({
          message: 'Rate-limit cleanup failed',
          error: error instanceof Error ? error.message : String(error),
        }))),
    );
    return response;
  } catch (error) {
    return errorResponse(error, context.request);
  }
}
