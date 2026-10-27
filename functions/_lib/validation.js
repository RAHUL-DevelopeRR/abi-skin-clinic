import { ApiError } from './http.js';

export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function text(value, field, { min = 1, max = 200, optional = false } = {}) {
  if (value === undefined || value === null) {
    if (optional) return '';
    throw new ApiError(400, 'VALIDATION_ERROR', `${field} is required.`);
  }
  const normalized = String(value).trim();
  if (!normalized && optional) return '';
  if (normalized.length < min || normalized.length > max) {
    throw new ApiError(400, 'VALIDATION_ERROR', `${field} must be between ${min} and ${max} characters.`);
  }
  return normalized;
}

export function id(value, field = 'ID') {
  const normalized = text(value, field, { min: 1, max: 80 });
  if (!/^[a-zA-Z0-9_-]+$/.test(normalized)) {
    throw new ApiError(400, 'VALIDATION_ERROR', `${field} is invalid.`);
  }
  return normalized;
}

export function date(value, field = 'Date') {
  const normalized = text(value, field, { min: 10, max: 10 });
  const parsed = DATE_PATTERN.test(normalized) ? new Date(`${normalized}T00:00:00Z`) : null;
  // Date rolls 2026-02-30 over to 2026-03-02, so the parsed date must round-trip to the input.
  if (!parsed || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== normalized) {
    throw new ApiError(400, 'VALIDATION_ERROR', `${field} must be a real date in YYYY-MM-DD format.`);
  }
  return normalized;
}

export function time(value, field = 'Time') {
  const normalized = text(value, field, { min: 5, max: 5 });
  if (!TIME_PATTERN.test(normalized)) {
    throw new ApiError(400, 'VALIDATION_ERROR', `${field} must use 24-hour HH:MM format.`);
  }
  return normalized;
}

export function phone(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  // Accept +91 98765 43210 and the trunk-prefixed 098765 43210 as well as 9876543210.
  const local = digits.replace(/^(91|0)(?=\d{10}$)/, '');
  if (!/^[6-9]\d{9}$/.test(local)) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Enter a valid 10-digit Indian mobile number.');
  }
  return local;
}

const GOOGLE_REVIEW_HOSTS = ['g.page', 'google.com', 'www.google.com', 'search.google.com', 'maps.google.com', 'maps.app.goo.gl', 'goo.gl'];

export function googleReviewUrl(value) {
  const normalized = text(value, 'Google review link', { max: 500, optional: true });
  if (!normalized) return '';
  let url;
  try {
    url = new URL(normalized);
  } catch {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Google review link must be a valid URL.');
  }
  if (url.protocol !== 'https:' || !GOOGLE_REVIEW_HOSTS.includes(url.hostname)) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Paste the https:// review link from your Google Business Profile.');
  }
  return url.toString();
}

export function integer(value, field, { min, max }) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new ApiError(400, 'VALIDATION_ERROR', `${field} must be between ${min} and ${max}.`);
  }
  return parsed;
}

export function oneOf(value, allowed, field) {
  if (!allowed.includes(value)) {
    throw new ApiError(400, 'VALIDATION_ERROR', `${field} is invalid.`);
  }
  return value;
}
