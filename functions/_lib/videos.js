import { ApiError } from './http.js';
import { hashText } from './auth.js';
import { integer, oneOf, text } from './validation.js';

/** "Under 100 MB" in the units phones show (1 MB = 1,000,000 bytes). */
export const MAX_VIDEO_BYTES = 100_000_000;
/** R2 multipart parts: every part except the last must be exactly this size (and at least 5 MiB). */
export const VIDEO_PART_BYTES = 8 * 1024 * 1024;
const UPLOAD_HOURS = 6;
const VIDEO_EXTENSIONS = { 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov' };

function utcTimestamp(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

function requireBucket(env) {
  if (!env.VIDEOS) throw new ApiError(503, 'VIDEO_STORAGE_NOT_CONFIGURED', 'Video storage is not configured.');
  return env.VIDEOS;
}

export function expectedPartCount(sizeBytes) {
  return Math.ceil(sizeBytes / VIDEO_PART_BYTES);
}

/** Size a part must have: full parts, then whatever is left for the last one. */
export function expectedPartSize(sizeBytes, partNumber) {
  const parts = expectedPartCount(sizeBytes);
  if (partNumber < 1 || partNumber > parts) return null;
  return partNumber < parts ? VIDEO_PART_BYTES : sizeBytes - VIDEO_PART_BYTES * (parts - 1);
}

/**
 * Parses a single "bytes=" range against the file size. Returns null to send the whole file
 * (no header, or a multi-range we do not support), 'unsatisfiable', or an R2 {offset, length}.
 */
export function parseByteRange(header, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(String(header || '').trim());
  if (!match || (!match[1] && !match[2])) return null;
  let start;
  let end;
  if (!match[1]) {
    const suffix = Number(match[2]);
    if (suffix === 0) return 'unsatisfiable';
    start = Math.max(size - suffix, 0);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  }
  if (start >= size || end < start) return 'unsatisfiable';
  return { offset: start, length: end - start + 1 };
}

function publicVideo(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    sizeBytes: row.size_bytes,
    contentType: row.content_type,
    status: row.status,
    published: Boolean(row.published),
    createdAt: row.created_at,
  };
}

/** Aborts uploads nobody finished, so half-uploaded parts do not sit in R2. */
async function removeExpiredUploads(env) {
  const { results } = await env.DB.prepare(`
    SELECT id, r2_key, upload_id FROM clinic_videos
    WHERE status = 'uploading' AND upload_expires_at < ?
  `).bind(utcTimestamp(new Date())).all();
  for (const row of results || []) {
    try {
      const bucket = requireBucket(env);
      if (row.upload_id) await bucket.resumeMultipartUpload(row.r2_key, row.upload_id).abort().catch(() => {});
      // complete() may have built the object before the row was marked ready.
      await bucket.delete(row.r2_key);
    } catch (error) {
      // Keep the row so the next listing retries the clean-up.
      console.error('Could not remove an expired video upload.', error.message);
      continue;
    }
    await env.DB.prepare('DELETE FROM clinic_videos WHERE id = ?').bind(row.id).run();
  }
}

export async function listVideos(env, { publishedOnly = false } = {}) {
  if (!publishedOnly) await removeExpiredUploads(env);
  const { results } = await env.DB.prepare(`
    SELECT id, title, description, size_bytes, content_type, status, published, created_at
    FROM clinic_videos
    ${publishedOnly ? "WHERE status = 'ready' AND published = 1" : ''}
    ORDER BY created_at DESC
  `).all();
  return (results || []).map(publicVideo);
}

/** Starts an upload: saves the row, opens an R2 multipart upload and returns a one-video upload token. */
export async function createVideoUpload(env, body) {
  const bucket = requireBucket(env);
  const title = text(body.title, 'Video title', { min: 2, max: 120 });
  const description = text(body.description, 'Description', { max: 500, optional: true });
  const contentType = oneOf(body.contentType, Object.keys(VIDEO_EXTENSIONS), 'Video type');
  const sizeBytes = Number(body.sizeBytes);
  if (Number.isInteger(sizeBytes) && sizeBytes > MAX_VIDEO_BYTES) {
    throw new ApiError(413, 'VIDEO_TOO_LARGE', 'Videos must be under 100 MB. ABI Doctor compresses larger videos automatically.');
  }
  integer(sizeBytes, 'Video size', { min: 1, max: MAX_VIDEO_BYTES });
  const published = body.published === undefined ? 1 : (body.published ? 1 : 0);

  const id = crypto.randomUUID();
  const key = `videos/${id}.${VIDEO_EXTENSIONS[contentType]}`;
  const upload = await bucket.createMultipartUpload(key, { httpMetadata: { contentType } });
  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  const uploadToken = btoa(String.fromCharCode(...tokenBytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const expiresAt = utcTimestamp(new Date(Date.now() + UPLOAD_HOURS * 3_600_000));
  await env.DB.prepare(`
    INSERT INTO clinic_videos (
      id, title, description, r2_key, content_type, size_bytes, published,
      upload_id, upload_token_hash, upload_expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, title, description, key, contentType, sizeBytes, published,
    upload.uploadId, await hashText(uploadToken), expiresAt,
  ).run();
  return {
    video: { id, title, description, sizeBytes, contentType, status: 'uploading', published: Boolean(published) },
    uploadToken,
    partSize: VIDEO_PART_BYTES,
    partCount: expectedPartCount(sizeBytes),
  };
}

async function findUpload(env, id) {
  const row = await env.DB.prepare(`
    SELECT id, r2_key, size_bytes, status, upload_id, upload_token_hash, upload_expires_at
    FROM clinic_videos WHERE id = ?
  `).bind(id).first();
  if (!row || row.status !== 'uploading' || !row.upload_id) {
    throw new ApiError(404, 'UPLOAD_NOT_FOUND', 'This video upload was not found or is already finished.');
  }
  if (row.upload_expires_at < utcTimestamp(new Date())) {
    throw new ApiError(410, 'UPLOAD_EXPIRED', 'This upload expired. Please upload the video again.');
  }
  return row;
}

/** Stores one part. Called by ABI Doctor (or the browser) with the upload token, not the admin cookie. */
export async function uploadVideoPart(env, request, id, partNumber) {
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  const row = await findUpload(env, id);
  if (!token || (await hashText(token)) !== row.upload_token_hash) {
    throw new ApiError(401, 'UPLOAD_UNAUTHORIZED', 'This upload link is not valid.');
  }
  const expectedSize = expectedPartSize(row.size_bytes, partNumber);
  if (expectedSize === null) throw new ApiError(400, 'VALIDATION_ERROR', 'Part number is out of range.');
  const declared = Number(request.headers.get('content-length') || 0);
  if (declared > expectedSize) throw new ApiError(413, 'PAYLOAD_TOO_LARGE', 'This part is larger than expected.');
  const body = await request.arrayBuffer();
  if (body.byteLength !== expectedSize) {
    throw new ApiError(400, 'VALIDATION_ERROR', `Part ${partNumber} must be ${expectedSize} bytes.`);
  }
  const part = await requireBucket(env).resumeMultipartUpload(row.r2_key, row.upload_id).uploadPart(partNumber, body);
  return { partNumber: part.partNumber, etag: part.etag };
}

export async function completeVideoUpload(env, id, body) {
  const bucket = requireBucket(env);
  const row = await findUpload(env, id);
  const count = expectedPartCount(row.size_bytes);
  const parts = Array.isArray(body.parts) ? body.parts : [];
  const sorted = parts
    .map((part) => ({ partNumber: Number(part?.partNumber), etag: String(part?.etag || '') }))
    .sort((a, b) => a.partNumber - b.partNumber);
  if (sorted.length !== count || sorted.some((part, index) => part.partNumber !== index + 1 || !part.etag)) {
    throw new ApiError(400, 'VALIDATION_ERROR', `Expected ${count} uploaded parts.`);
  }
  const object = await bucket.resumeMultipartUpload(row.r2_key, row.upload_id).complete(sorted);
  if (object.size > MAX_VIDEO_BYTES) {
    await bucket.delete(row.r2_key);
    await env.DB.prepare('DELETE FROM clinic_videos WHERE id = ?').bind(id).run();
    throw new ApiError(413, 'VIDEO_TOO_LARGE', 'Videos must be under 100 MB.');
  }
  await env.DB.prepare(`
    UPDATE clinic_videos
    SET status = 'ready', size_bytes = ?, upload_id = NULL, upload_token_hash = NULL,
        upload_expires_at = NULL, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(object.size, id).run();
}

export async function updateVideo(env, id, body) {
  const changes = [];
  const values = [];
  if (body.title !== undefined) {
    changes.push('title = ?');
    values.push(text(body.title, 'Video title', { min: 2, max: 120 }));
  }
  if (body.description !== undefined) {
    changes.push('description = ?');
    values.push(text(body.description, 'Description', { max: 500, optional: true }));
  }
  if (body.published !== undefined) {
    changes.push('published = ?');
    values.push(body.published ? 1 : 0);
  }
  if (!changes.length) throw new ApiError(400, 'VALIDATION_ERROR', 'Nothing to update.');
  const result = await env.DB.prepare(`
    UPDATE clinic_videos SET ${changes.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(...values, id).run();
  if (!result.meta.changes) throw new ApiError(404, 'VIDEO_NOT_FOUND', 'Video was not found.');
}

export async function deleteVideo(env, id) {
  const bucket = requireBucket(env);
  const row = await env.DB.prepare('SELECT r2_key, status, upload_id FROM clinic_videos WHERE id = ?').bind(id).first();
  if (!row) throw new ApiError(404, 'VIDEO_NOT_FOUND', 'Video was not found.');
  if (row.status === 'uploading' && row.upload_id) {
    await bucket.resumeMultipartUpload(row.r2_key, row.upload_id).abort().catch(() => {});
  }
  // Always, because complete() may have built the object before the row was marked ready.
  await bucket.delete(row.r2_key);
  await env.DB.prepare('DELETE FROM clinic_videos WHERE id = ?').bind(id).run();
}

/** Streams a finished video from R2 with byte-range support, which players need to seek. */
export async function serveVideo(env, request, id, { publishedOnly }) {
  const bucket = requireBucket(env);
  const row = await env.DB.prepare(`
    SELECT r2_key, content_type FROM clinic_videos
    WHERE id = ? AND status = 'ready' ${publishedOnly ? 'AND published = 1' : ''}
  `).bind(id).first();
  const head = row ? await bucket.head(row.r2_key) : null;
  if (!head) throw new ApiError(404, 'VIDEO_NOT_FOUND', 'Video was not found.');

  const headers = new Headers({
    'Accept-Ranges': 'bytes',
    'Cache-Control': publishedOnly ? 'public, max-age=86400' : 'private, max-age=300',
    'Content-Type': row.content_type,
    'ETag': head.httpEtag,
    'X-Content-Type-Options': 'nosniff',
  });
  const range = parseByteRange(request.headers.get('range'), head.size);
  if (range === 'unsatisfiable') {
    headers.set('Content-Range', `bytes */${head.size}`);
    return new Response(null, { status: 416, headers });
  }
  const length = range ? range.length : head.size;
  headers.set('Content-Length', String(length));
  if (range) headers.set('Content-Range', `bytes ${range.offset}-${range.offset + length - 1}/${head.size}`);
  const status = range ? 206 : 200;
  if (request.method === 'HEAD') return new Response(null, { status, headers });
  const object = await bucket.get(row.r2_key, range ? { range } : {});
  if (!object) throw new ApiError(404, 'VIDEO_NOT_FOUND', 'Video was not found.');
  return new Response(object.body, { status, headers });
}
