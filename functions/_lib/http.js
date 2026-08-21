export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
};

export function json(data, status = 200, extraHeaders = {}) {
  return Response.json(data, {
    status,
    headers: {
      ...SECURITY_HEADERS,
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  });
}

export async function readJson(request, maxBytes = 16_384) {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new ApiError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Expected an application/json request.');
  }

  const declaredLength = Number(request.headers.get('content-length') || 0);
  if (declaredLength > maxBytes) {
    throw new ApiError(413, 'PAYLOAD_TOO_LARGE', 'Request body is too large.');
  }

  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > maxBytes) {
    throw new ApiError(413, 'PAYLOAD_TOO_LARGE', 'Request body is too large.');
  }

  try {
    return JSON.parse(body || '{}');
  } catch {
    throw new ApiError(400, 'INVALID_JSON', 'Request body contains invalid JSON.');
  }
}

export function requireSameOrigin(request) {
  const origin = request.headers.get('origin');
  const expected = new URL(request.url).origin;
  if (origin && origin !== expected) {
    throw new ApiError(403, 'INVALID_ORIGIN', 'Cross-origin admin request rejected.');
  }
}

export function methodNotAllowed(allowed) {
  return json(
    { error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed.' } },
    405,
    { Allow: allowed.join(', ') },
  );
}

export function errorResponse(error, request) {
  if (error instanceof ApiError) {
    return json({ error: { code: error.code, message: error.message } }, error.status);
  }

  console.error(JSON.stringify({
    message: 'Unhandled API error',
    path: new URL(request.url).pathname,
    error: error instanceof Error ? error.message : String(error),
  }));
  return json(
    { error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } },
    500,
  );
}
