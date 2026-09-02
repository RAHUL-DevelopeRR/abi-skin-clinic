import assert from 'node:assert/strict';
import test from 'node:test';

import { sendNewAppointmentNotification } from '../functions/_lib/push.js';

test('push notifications are safely disabled until Firebase is configured', async () => {
  await assert.doesNotReject(() => sendNewAppointmentNotification({}));
});
