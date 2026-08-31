import { ApiError } from './http.js';
import { hashText } from './auth.js';

export async function enforceRateLimit(db, request, scope, limit, windowSeconds) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const ipHash = await hashText(ip);
  const windowStart = Math.floor(Date.now() / 1000 / windowSeconds) * windowSeconds;
  const bucket = `${scope}:${ipHash}`;
  const row = await db.prepare(`
    INSERT INTO rate_limits (bucket, window_start, count)
    VALUES (?, ?, 1)
    ON CONFLICT(bucket, window_start) DO UPDATE SET count = count + 1
    RETURNING count
  `).bind(bucket, windowStart).first();
  if (Number(row?.count || 0) > limit) {
    throw new ApiError(429, 'RATE_LIMITED', 'Too many requests. Please try again later.');
  }
}

export async function writeAudit(db, action, entityType, entityId = null, metadata = {}) {
  await db.prepare(`
    INSERT INTO audit_log (id, action, entity_type, entity_id, metadata)
    VALUES (?, ?, ?, ?, ?)
  `).bind(crypto.randomUUID(), action, entityType, entityId, JSON.stringify(metadata)).run();
}

export function isUniqueConstraintError(error) {
  return error instanceof Error && error.message.includes('UNIQUE constraint failed');
}
