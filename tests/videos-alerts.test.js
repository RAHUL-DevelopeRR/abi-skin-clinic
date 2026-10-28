import assert from 'node:assert/strict';
import test from 'node:test';

import { appointmentAlertMessage, appointmentAlertText } from '../functions/_lib/push.js';
import {
  MAX_VIDEO_BYTES, VIDEO_PART_BYTES, expectedPartCount, expectedPartSize, parseByteRange,
} from '../functions/_lib/videos.js';

test('video range requests are clamped to the file, as players expect', () => {
  assert.deepEqual(parseByteRange('bytes=0-', 1000), { offset: 0, length: 1000 });
  assert.deepEqual(parseByteRange('bytes=100-199', 1000), { offset: 100, length: 100 });
  assert.deepEqual(parseByteRange('bytes=900-5000', 1000), { offset: 900, length: 100 });
  assert.deepEqual(parseByteRange('bytes=-200', 1000), { offset: 800, length: 200 });
  assert.deepEqual(parseByteRange('bytes=-5000', 1000), { offset: 0, length: 1000 });
  assert.equal(parseByteRange('bytes=1000-', 1000), 'unsatisfiable');
  assert.equal(parseByteRange('bytes=-0', 1000), 'unsatisfiable');
  assert.equal(parseByteRange(null, 1000), null);
  assert.equal(parseByteRange('bytes=0-1,5-6', 1000), null);
});

test('every video part but the last is the full R2 part size', () => {
  assert.ok(VIDEO_PART_BYTES >= 5 * 1024 * 1024, 'R2 rejects non-final parts under 5 MiB');
  const size = VIDEO_PART_BYTES * 2 + 123;
  assert.equal(expectedPartCount(size), 3);
  assert.equal(expectedPartSize(size, 1), VIDEO_PART_BYTES);
  assert.equal(expectedPartSize(size, 3), 123);
  assert.equal(expectedPartSize(size, 4), null);
  assert.equal(expectedPartSize(VIDEO_PART_BYTES, 1), VIDEO_PART_BYTES);
  assert.equal(expectedPartCount(MAX_VIDEO_BYTES), 12);
});

test('ringing phones get a data-only push; older apps keep a normal notification', () => {
  const body = appointmentAlertText('Karur Clinic (Main Branch)', '2026-10-29', '10:30');
  assert.equal(body, 'Karur Clinic (Main Branch) · Thu, 29 Oct 2026 · 10:30 AM');

  const ring = appointmentAlertMessage('token-a', 'ring', 'appt-1', body);
  assert.equal(ring.notification, undefined, 'a notification payload would stop the app from ringing');
  assert.equal(ring.data.type, 'appointment_request');
  assert.equal(ring.android.priority, 'high');
  assert.ok(Object.values(ring.data).every((value) => typeof value === 'string'), 'FCM data values must be strings');

  const plain = appointmentAlertMessage('token-b', 'notification', 'appt-1', body);
  assert.equal(plain.notification.body, body);
  assert.equal(plain.android.notification.channel_id, 'appointments');
});
