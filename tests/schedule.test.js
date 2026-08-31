import test from 'node:test';
import assert from 'node:assert/strict';
import { generateSlots, getDayOfWeek, getZonedNow, minutesToTime, timeToMinutes } from '../functions/_lib/schedule.js';

test('time conversion is stable', () => {
  assert.equal(timeToMinutes('09:30'), 570);
  assert.equal(minutesToTime(570), '09:30');
});

test('day of week uses the appointment date without local timezone drift', () => {
  assert.equal(getDayOfWeek('2026-08-23'), 0);
  assert.equal(getDayOfWeek('2026-08-24'), 1);
});

test('slots stop before the period end and exclude occupied times', () => {
  const slots = generateSlots(
    [{ start_time: '09:00', end_time: '10:30', slot_minutes: 30 }],
    ['09:30'],
  );
  assert.deepEqual(slots, ['09:00', '10:00']);
});

test('same-day minimum notice removes near-term slots', () => {
  const slots = generateSlots(
    [{ start_time: '09:00', end_time: '13:00', slot_minutes: 30 }],
    [],
    { date: '2026-08-21', today: '2026-08-21', currentMinutes: 600, minimumNoticeMinutes: 60 },
  );
  assert.deepEqual(slots, ['11:00', '11:30', '12:00', '12:30']);
});

test('clinic time is evaluated in Asia/Kolkata', () => {
  assert.deepEqual(
    getZonedNow('Asia/Kolkata', new Date('2026-08-20T20:00:00.000Z')),
    { date: '2026-08-21', minutes: 90 },
  );
});
