import { ApiError } from './http.js';
import { date as validateDate, id as validateId } from './validation.js';

export function timeToMinutes(value) {
  const [hours, minutes] = value.split(':').map(Number);
  return (hours * 60) + minutes;
}

export function minutesToTime(total) {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function getDayOfWeek(date) {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

export function getZonedNow(timeZone = 'Asia/Kolkata', now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    minutes: (Number(values.hour) * 60) + Number(values.minute),
  };
}

export function generateSlots(periods, occupied, options = {}) {
  const occupiedMinutes = occupied.map(timeToMinutes);
  const slots = [];
  const sameDay = options.date && options.today && options.date === options.today;
  const earliest = sameDay
    ? Number(options.currentMinutes || 0) + Number(options.minimumNoticeMinutes || 0)
    : -1;

  for (const period of periods) {
    const start = timeToMinutes(period.start_time);
    const end = timeToMinutes(period.end_time);
    const interval = Number(period.slot_minutes);
    for (let cursor = start; cursor + interval <= end; cursor += interval) {
      // A booking made on an older grid (other slot length or start time) blocks every slot
      // it overlaps, not only an identical time string.
      const overlaps = occupiedMinutes.some((booked) => Math.abs(cursor - booked) < interval);
      if (cursor >= earliest && !overlaps) slots.push(minutesToTime(cursor));
    }
  }
  return slots;
}

async function getSettingNumber(db, key, fallback) {
  const row = await db.prepare('SELECT value FROM settings WHERE key = ?').bind(key).first();
  const parsed = Number(row?.value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function getAvailability(db, branchValue, dateValue, now = new Date()) {
  const branchId = validateId(branchValue, 'Branch');
  const appointmentDate = validateDate(dateValue, 'Appointment date');
  const branch = await db
    .prepare('SELECT id, name, timezone FROM branches WHERE id = ? AND active = 1')
    .bind(branchId)
    .first();
  if (!branch) throw new ApiError(404, 'BRANCH_NOT_FOUND', 'Clinic branch was not found.');

  const zonedNow = getZonedNow(branch.timezone || 'Asia/Kolkata', now);
  const targetTimestamp = Date.parse(`${appointmentDate}T00:00:00Z`);
  const todayTimestamp = Date.parse(`${zonedNow.date}T00:00:00Z`);
  const horizonDays = await getSettingNumber(db, 'booking_horizon_days', 90);
  const daysAhead = Math.round((targetTimestamp - todayTimestamp) / 86_400_000);
  if (daysAhead < 0) throw new ApiError(400, 'DATE_IN_PAST', 'Past dates cannot be booked.');
  if (daysAhead > horizonDays) {
    throw new ApiError(400, 'DATE_TOO_FAR', `Appointments can be booked up to ${horizonDays} days ahead.`);
  }

  const leave = await db.prepare(`
    SELECT reason FROM leave_days
    WHERE leave_date = ? AND (branch_id IS NULL OR branch_id = ?)
    ORDER BY branch_id IS NULL DESC LIMIT 1
  `).bind(appointmentDate, branchId).first();
  if (leave) {
    return { branchId, date: appointmentDate, slots: [], closed: true, reason: leave.reason };
  }

  const [periodResult, occupiedResult] = await db.batch([
    db.prepare(`
      SELECT start_time, end_time, slot_minutes
      FROM working_hours
      WHERE branch_id = ? AND day_of_week = ? AND active = 1
      ORDER BY period_index
    `).bind(branchId, getDayOfWeek(appointmentDate)),
    db.prepare(`
      SELECT time_slot FROM appointments
      WHERE branch_id = ? AND appointment_date = ?
        AND status IN ('requested', 'confirmed')
    `).bind(branchId, appointmentDate),
  ]);

  const periods = periodResult.results || [];
  if (!periods.length) {
    return { branchId, date: appointmentDate, slots: [], closed: true, reason: 'Not a working day' };
  }

  const minimumNoticeMinutes = await getSettingNumber(db, 'minimum_booking_notice_minutes', 60);
  const slots = generateSlots(
    periods,
    (occupiedResult.results || []).map((row) => row.time_slot),
    {
      date: appointmentDate,
      today: zonedNow.date,
      currentMinutes: zonedNow.minutes,
      minimumNoticeMinutes,
    },
  );

  return { branchId, date: appointmentDate, slots, closed: false, reason: '' };
}
