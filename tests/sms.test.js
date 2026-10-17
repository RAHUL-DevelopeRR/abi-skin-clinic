import assert from 'node:assert/strict';
import test from 'node:test';

import { WHATSAPP_TEMPLATES, transitionEvent } from '../functions/_lib/patient-messages.js';
import { buildSmsMessage } from '../functions/_lib/sms.js';

const ORIGIN = 'https://abiskinandhaircare.in';
const TYPICAL = {
  branch_id: 'karur',
  reference: 'ABI-20261020-ABC123',
  patient_name: 'Priya Kumar',
  appointment_date: '2026-10-20',
  time_slot: '16:30',
  branch_name: 'Karur Clinic (Main Branch)',
  branch_phone: '+91 75981 26430',
  service_name: 'Acne & Acne Scar Treatment',
};
const LONGEST = {
  ...TYPICAL,
  branch_id: 'velayuthampalayam',
  patient_name: 'Venkatalakshmi Ramasubramanian',
  appointment_date: '2026-10-21',
  time_slot: '10:30',
  branch_name: 'Velayuthampalayam Clinic',
  branch_phone: '+91 94437 66998',
  service_name: 'Acne Pigmentation & Pigmentation Lasers',
};
const EVENTS = ['booked', 'confirmed', 'rejected', 'cancelled', 'completed'];

test('status changes map to the right automatic message', () => {
  assert.equal(transitionEvent('requested', 'confirmed'), 'confirmed');
  assert.equal(transitionEvent('requested', 'cancelled'), 'rejected');
  assert.equal(transitionEvent('confirmed', 'cancelled'), 'cancelled');
  assert.equal(transitionEvent('confirmed', 'completed'), 'completed');
  assert.equal(transitionEvent('confirmed', 'confirmed'), null);
  assert.equal(transitionEvent('confirmed', 'no_show'), null);
});

test('every patient SMS fits in one 160-character message', () => {
  for (const appointment of [TYPICAL, LONGEST]) {
    for (const event of EVENTS) {
      const message = buildSmsMessage(event, appointment, ORIGIN);
      assert.ok(message.length <= 160, `${event} is ${message.length} chars: ${message}`);
      assert.ok(message.includes(event === 'completed' ? 'Hi ' : appointment.patient_name.split(' ')[0]));
    }
  }
});

test('SMS include the name and appointment details', () => {
  const confirmed = buildSmsMessage('confirmed', TYPICAL, ORIGIN);
  assert.match(confirmed, /^Hi Priya, /);
  assert.match(confirmed, /CONFIRMED/);
  assert.match(confirmed, /Acne & Acne Scar Treatment/);
  assert.match(confirmed, /Tue 20 Oct 4:30 PM/);
  assert.match(confirmed, /Karur/);
  assert.match(confirmed, /ABI-20261020-ABC123/);
  assert.match(confirmed, /7598126430/);
});

test('long details drop the treatment name to stay in one SMS', () => {
  const booked = buildSmsMessage('booked', LONGEST, ORIGIN);
  assert.doesNotMatch(booked, /Pigmentation/);
  assert.match(booked, /Velayuthampalayam/);
});

test('rejected and completed SMS use their own wording and short review link', () => {
  assert.match(buildSmsMessage('rejected', TYPICAL, ORIGIN), /sorry, ABI Skin Clinic cannot take your Tue 20 Oct 4:30 PM slot/);
  assert.match(buildSmsMessage('completed', TYPICAL, ORIGIN), /abiskinandhaircare\.in\/r\/karur$/);
});

test('WhatsApp templates neither start nor end with a variable', () => {
  for (const { name, body, example } of Object.values(WHATSAPP_TEMPLATES)) {
    assert.doesNotMatch(body, /^\{\{|\}\}$/, name);
    assert.equal((body.match(/\{\{\d+\}\}/g) || []).length, example.length, `${name} example count`);
  }
});
