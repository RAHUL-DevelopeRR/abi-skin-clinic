import assert from 'node:assert/strict';
import test from 'node:test';

import { alreadyNotified } from '../functions/_lib/patient-messages.js';
import { generateSlots } from '../functions/_lib/schedule.js';
import { buildSmsMessage, isGsm7 } from '../functions/_lib/sms.js';
import { date as validateDate, phone as validatePhone } from '../functions/_lib/validation.js';

const ORIGIN = 'https://abiskinandhaircare.in';
const APPOINTMENT = {
  branch_id: 'karur',
  reference: 'ABI-20261020-ABC123',
  patient_name: 'Priya Kumar',
  appointment_date: '2026-10-20',
  time_slot: '16:30',
  branch_name: 'Karur Clinic (Main Branch)',
  branch_phone: '+91 75981 26430',
  service_name: 'Acne & Acne Scar Treatment',
};

/** A D1 stand-in whose query returns the latest non-failed notification passed in. */
function dbWithLatest(event) {
  return { prepare: () => ({ bind: () => ({ first: async () => (event ? { event } : null) }) }) };
}

test('impossible calendar dates are rejected instead of rolling over', () => {
  assert.equal(validateDate('2026-10-27'), '2026-10-27');
  assert.equal(validateDate('2028-02-29'), '2028-02-29');
  for (const value of ['2026-02-30', '2026-04-31', '2027-02-29', '2026-13-01']) {
    assert.throws(() => validateDate(value), /real date/, value);
  }
});

test('Indian mobile numbers are accepted with +91 or a leading 0', () => {
  for (const value of ['9876543210', '+91 98765 43210', '+91-98765-43210', '098765 43210']) {
    assert.equal(validatePhone(value), '9876543210', value);
  }
  assert.throws(() => validatePhone('5876543210'));
});

test('a booking on an older slot grid blocks every slot it overlaps', () => {
  const periods = [{ start_time: '16:00', end_time: '18:00', slot_minutes: 20 }];
  // 16:30 was booked on the old 30-minute grid; 16:20 and 16:40 overlap it.
  assert.deepEqual(generateSlots(periods, ['16:30']), ['16:00', '17:00', '17:20', '17:40']);
  // Identical times are still blocked on an unchanged grid.
  assert.deepEqual(
    generateSlots([{ start_time: '09:00', end_time: '10:30', slot_minutes: 30 }], ['09:30']),
    ['09:00', '10:00'],
  );
});

test('a status change texts the patient unless their latest message already says it', async () => {
  assert.equal(await alreadyNotified(dbWithLatest('confirmed'), 'a1', 'confirmed', 'sms'), true);
  // confirmed -> cancelled -> confirmed: the latest SMS says cancelled, so re-confirm is sent.
  assert.equal(await alreadyNotified(dbWithLatest('cancelled'), 'a1', 'confirmed', 'sms'), false);
  assert.equal(await alreadyNotified(dbWithLatest(null), 'a1', 'booked', 'sms'), false);
});

test('a name outside the GSM SMS alphabet is dropped to keep a single SMS', () => {
  assert.equal(isGsm7('Hi Priya, Ref ABI-1 & more'), true);
  assert.equal(isGsm7('பிரியா'), false);
  const message = buildSmsMessage('confirmed', { ...APPOINTMENT, patient_name: 'பிரியா குமார்' }, ORIGIN);
  assert.ok(message.startsWith('Hi there,'), message);
  assert.ok(isGsm7(message) && message.length <= 160, message);
});
