import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { BRANCHES, FAQS, SITE_URL } from '../src/data/clinic.js';
import { buildLlmsTxt } from '../src/seo/llmsTxt.js';
import { PAGE_DESCRIPTION, PAGE_TITLE, buildStructuredData } from '../src/seo/structuredData.js';

const graph = buildStructuredData()['@graph'];
const types = (entity) => [].concat(entity['@type']);
const byId = (id) => graph.find((entity) => entity['@id'] === id);
const indexHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8');

/** Every {"@id": ...} reference inside a value. */
function references(value, found = []) {
  if (Array.isArray(value)) value.forEach((item) => references(item, found));
  else if (value && typeof value === 'object') {
    if (Object.keys(value).length === 1 && value['@id']) found.push(value['@id']);
    else Object.values(value).forEach((item) => references(item, found));
  }
  return found;
}

test('structured data is valid JSON with unique ids and no dangling references', () => {
  const parsed = JSON.parse(JSON.stringify(buildStructuredData()));
  assert.equal(parsed['@context'], 'https://schema.org');
  const ids = graph.map((entity) => entity['@id']);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.ok(id.startsWith(`${SITE_URL}/#`), id);
  for (const id of references(graph)) assert.ok(byId(id), `unresolved reference ${id}`);
});

test('each branch is a local business with the details Google requires and recommends', () => {
  for (const branch of BRANCHES) {
    const entity = byId(`${SITE_URL}/#${branch.id}`);
    assert.ok(entity, branch.id);
    assert.ok(types(entity).includes('MedicalClinic'));
    assert.ok(entity.name);
    assert.match(entity.telephone, /^\+91\d{10}$/);
    const { address } = entity;
    for (const key of ['streetAddress', 'addressLocality', 'addressRegion', 'postalCode', 'addressCountry']) assert.ok(address[key], key);
    assert.match(address.postalCode, /^6\d{5}$/);
    assert.equal(address.addressCountry, 'IN');
    // Within Karur district, Tamil Nadu.
    assert.ok(entity.geo.latitude > 10.7 && entity.geo.latitude < 11.3, 'latitude');
    assert.ok(entity.geo.longitude > 77.7 && entity.geo.longitude < 78.5, 'longitude');
    assert.equal(entity.hasMap, `https://www.google.com/maps?cid=${branch.googleCid}`);
    assert.ok(entity.openingHoursSpecification.length > 0);
    for (const hours of entity.openingHoursSpecification) {
      assert.match(hours.opens, /^([01]\d|2[0-3]):[0-5]\d$/);
      assert.match(hours.closes, /^([01]\d|2[0-3]):[0-5]\d$/);
      assert.ok(hours.opens < hours.closes);
      assert.ok(!hours.dayOfWeek.includes('Sunday'), 'both branches are closed on Sunday');
    }
  }
});

test('structured data claims no ratings, reviews or prices the clinic has not published', () => {
  const json = JSON.stringify(graph);
  for (const property of ['aggregateRating', '"review"', 'priceRange', '"price"']) assert.ok(!json.includes(property), property);
});

test('the doctor is a Person with the credentials shown on the page', () => {
  const doctor = byId(`${SITE_URL}/#doctor`);
  assert.deepEqual(types(doctor), ['Person']);
  assert.equal(doctor.name, 'Dr. G. Srinivasan');
  assert.deepEqual(doctor.hasCredential.map((credential) => credential.name), ['MBBS', 'DD (Diploma in Dermatology)']);
  // medicalSpecialty is not a Person property.
  assert.equal(doctor.medicalSpecialty, undefined);
});

test('FAQ markup is exactly the FAQ shown on the page', () => {
  const page = byId(`${SITE_URL}/#webpage`);
  assert.ok(types(page).includes('FAQPage'));
  assert.deepEqual(page.mainEntity.map((question) => question.name), FAQS.map((faq) => faq.question));
  assert.deepEqual(page.mainEntity.map((question) => question.acceptedAnswer.text), FAQS.map((faq) => faq.answer));
  const timings = FAQS.find((faq) => faq.question.includes('timings')).answer;
  assert.ok(timings.includes('9:00 AM - 1:00 PM and 4:00 PM - 8:30 PM'));
  assert.ok(timings.includes('5:30 PM - 8:30 PM'));
});

test('index.html title, description and canonical match the published page data', () => {
  const unescape = (text) => text.replace(/&amp;/g, '&');
  assert.equal(unescape(indexHtml.match(/<title>([^<]*)<\/title>/)[1]), PAGE_TITLE);
  assert.equal(unescape(indexHtml.match(/<meta name="description" content="([^"]*)"/)[1]), PAGE_DESCRIPTION);
  assert.ok(PAGE_TITLE.length <= 70, `title is ${PAGE_TITLE.length} characters`);
  assert.ok(PAGE_DESCRIPTION.length <= 160, `description is ${PAGE_DESCRIPTION.length} characters`);
  assert.ok(indexHtml.includes(`<link rel="canonical" href="${SITE_URL}/" />`));
  assert.ok(indexHtml.includes('<html lang="en-IN">'));
  // The JSON-LD is added at build time from structuredData.js, not kept by hand in index.html.
  assert.ok(!indexHtml.includes('application/ld+json'));
});

test('llms.txt has a title, a summary and links, as the llmstxt.org format asks', () => {
  const text = buildLlmsTxt();
  assert.match(text, /^# .+\n\n> .+/);
  assert.match(text, /\[[^\]]+\]\(https:\/\/abiskinandhaircare\.in\/[^)]*\)/);
  for (const branch of BRANCHES) assert.ok(text.includes(branch.phone), branch.id);
});
