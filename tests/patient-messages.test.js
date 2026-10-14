import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildPatientMessage, eventForStatus, formatDisplayDate, formatDisplayTime, googleReviewLink, sendPatientWhatsApp,
} from '../functions/_lib/patient-messages.js';

const ORIGIN = 'https://abiskinandhaircare.in';
const APPOINTMENT = {
  id: 'appt-1',
  reference: 'ABI-20261020-ABC123',
  patient_name: 'Priya',
  phone: '9876543210',
  appointment_date: '2026-10-20',
  time_slot: '16:30',
  status: 'requested',
  review_token: null,
  branch_name: 'Karur Clinic (Main Branch)',
  branch_address: '10 West, North Madavalagam Road, Karur',
  branch_phone: '+91 75981 26430',
  service_name: 'Acne & Acne Scar Treatment',
};

test('appointment statuses map to patient message events', () => {
  assert.equal(eventForStatus('requested'), 'booked');
  assert.equal(eventForStatus('confirmed'), 'confirmed');
  assert.equal(eventForStatus('no_show'), 'no_show');
  assert.equal(eventForStatus('unknown'), null);
});

test('dates and times are formatted for patients', () => {
  assert.equal(formatDisplayTime('16:30'), '4:30 PM');
  assert.equal(formatDisplayTime('09:00'), '9:00 AM');
  assert.equal(formatDisplayDate('2026-10-20'), 'Tue, 20 Oct 2026');
});

test('booking acknowledgement includes the reference and tracking link', () => {
  const message = buildPatientMessage('booked', APPOINTMENT, ORIGIN);
  assert.match(message, /ABI-20261020-ABC123/);
  assert.match(message, /4:30 PM/);
  assert.match(message, /https:\/\/abiskinandhaircare\.in\/#track/);
});

test('completed message sends the patient to the clinic Google reviews', () => {
  const googleUrl = 'https://www.google.com/maps/place/Abi/data=!12e1';
  const message = buildPatientMessage('completed', { ...APPOINTMENT, google_review_url: googleUrl }, ORIGIN);
  assert.ok(message.includes(googleUrl));
  assert.match(buildPatientMessage('completed', APPOINTMENT, ORIGIN), /https:\/\/www\.google\.com\/maps\/search\//);
});

test('google review link falls back to the Maps listing', () => {
  assert.equal(googleReviewLink({ google_review_url: 'https://g.page/r/abc/review' }), 'https://g.page/r/abc/review');
  assert.match(googleReviewLink({ google_review_url: '', name: 'Karur', address: 'Karur' }), /^https:\/\/www\.google\.com\/maps\/search\//);
});

test('WhatsApp is skipped until the Cloud API is configured', async () => {
  const result = await sendPatientWhatsApp({}, APPOINTMENT, 'booked', ORIGIN, () => assert.fail('must not call the API'));
  assert.deepEqual(result, { sent: false, skipped: true });
});

test('WhatsApp sends the approved template with ordered parameters', async () => {
  let request;
  const fakeFetch = async (url, init) => {
    request = { url, body: JSON.parse(init.body), auth: init.headers.Authorization };
    return new Response(JSON.stringify({ messages: [{ id: 'wamid.1' }] }), { status: 200 });
  };
  const env = { WHATSAPP_ACCESS_TOKEN: 'secret', WHATSAPP_PHONE_NUMBER_ID: '12345' };
  const result = await sendPatientWhatsApp(env, APPOINTMENT, 'confirmed', ORIGIN, fakeFetch);
  assert.equal(result.sent, true);
  assert.equal(request.url, 'https://graph.facebook.com/v23.0/12345/messages');
  assert.equal(request.auth, 'Bearer secret');
  assert.equal(request.body.to, '919876543210');
  assert.equal(request.body.template.name, 'appointment_confirmed');
  assert.deepEqual(
    request.body.template.components[0].parameters.map((parameter) => parameter.text),
    ['Priya', 'Karur Clinic (Main Branch)', formatDisplayDate('2026-10-20'), '4:30 PM', 'ABI-20261020-ABC123', '+91 75981 26430'],
  );
});

test('WhatsApp API errors are reported without throwing', async () => {
  const fakeFetch = async () => new Response(JSON.stringify({ error: { message: 'Template not approved' } }), { status: 400 });
  const env = { WHATSAPP_ACCESS_TOKEN: 'secret', WHATSAPP_PHONE_NUMBER_ID: '12345' };
  const result = await sendPatientWhatsApp(env, APPOINTMENT, 'booked', ORIGIN, fakeFetch);
  assert.deepEqual(result, { sent: false, skipped: false, error: 'Template not approved' });
});
