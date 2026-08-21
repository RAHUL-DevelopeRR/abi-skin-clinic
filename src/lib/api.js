export class ApiClientError extends Error {
  constructor(message, code, status) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
  }
}

export async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'same-origin',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  let payload = {};
  try {
    payload = await response.json();
  } catch {
    if (!response.ok) throw new ApiClientError('The server returned an invalid response.', 'INVALID_RESPONSE', response.status);
  }
  if (!response.ok) {
    throw new ApiClientError(
      payload.error?.message || 'The request could not be completed.',
      payload.error?.code || 'REQUEST_FAILED',
      response.status,
    );
  }
  return payload;
}

let bootstrapPromise;

export function getPublicBootstrap({ refresh = false } = {}) {
  if (refresh || !bootstrapPromise) {
    bootstrapPromise = api('/api/public/bootstrap').catch((error) => {
      bootstrapPromise = undefined;
      throw error;
    });
  }
  return bootstrapPromise;
}

export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getMaximumBookingDate(days = 90) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return getLocalDateString(date);
}

export function formatTime(value) {
  const [hourText, minute] = String(value).split(':');
  const hour = Number(hourText);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${String(displayHour).padStart(2, '0')}:${minute} ${suffix}`;
}
