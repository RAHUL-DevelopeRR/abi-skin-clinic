import { ApiError } from './http.js';

const COOKIE_NAME = 'abi_admin_session';
const SESSION_SECONDS = 12 * 60 * 60;

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function bytesToBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export async function hashText(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return bytesToHex(new Uint8Array(digest));
}

export async function verifySecret(provided, expected) {
  const encoder = new TextEncoder();
  const [providedDigest, expectedDigest] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(provided)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ]);
  const left = new Uint8Array(providedDigest);
  const right = new Uint8Array(expectedDigest);
  if (typeof crypto.subtle.timingSafeEqual === 'function') {
    return crypto.subtle.timingSafeEqual(left, right);
  }
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

function readCookie(request, name) {
  const cookies = request.headers.get('cookie') || '';
  for (const part of cookies.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

function sessionCookie(token, request) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly${secure}; SameSite=Strict; Path=/; Max-Age=${SESSION_SECONDS}`;
}

export function clearSessionCookie(request) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${COOKIE_NAME}=; HttpOnly${secure}; SameSite=Strict; Path=/; Max-Age=0`;
}

export async function createSession(db, request) {
  const tokenBytes = new Uint8Array(32);
  crypto.getRandomValues(tokenBytes);
  const token = bytesToBase64Url(tokenBytes);
  const tokenHash = await hashText(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + (SESSION_SECONDS * 1000));
  const ip = request.headers.get('CF-Connecting-IP') || '';
  const userAgent = request.headers.get('user-agent') || '';
  const [ipHash, userAgentHash] = await Promise.all([hashText(ip), hashText(userAgent)]);

  await db.batch([
    db.prepare('DELETE FROM admin_sessions WHERE expires_at <= ?').bind(now.toISOString()),
    db.prepare(`
      INSERT INTO admin_sessions (token_hash, created_at, expires_at, ip_hash, user_agent_hash)
      VALUES (?, ?, ?, ?, ?)
    `).bind(tokenHash, now.toISOString(), expiresAt.toISOString(), ipHash, userAgentHash),
  ]);
  return sessionCookie(token, request);
}

export async function destroySession(db, request) {
  const token = readCookie(request, COOKIE_NAME);
  if (token) {
    await db.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').bind(await hashText(token)).run();
  }
}

export async function requireAdmin(db, request) {
  const token = readCookie(request, COOKIE_NAME);
  if (!token) throw new ApiError(401, 'UNAUTHORIZED', 'Doctor login is required.');
  const session = await db.prepare(`
    SELECT expires_at FROM admin_sessions
    WHERE token_hash = ? AND expires_at > ?
  `).bind(await hashText(token), new Date().toISOString()).first();
  if (!session) throw new ApiError(401, 'UNAUTHORIZED', 'Your session has expired. Please sign in again.');
  return session;
}
