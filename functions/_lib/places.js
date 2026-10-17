import { ApiError } from './http.js';
import { enforceRateLimit } from './database.js';

const PLACES_BASE = 'https://places.googleapis.com/v1';
// Place Details with reviews is billed as "Enterprise + Atmosphere": 1,000 free calls a
// month. 32 a day keeps a 31-day month under that unless GOOGLE_PLACES_DAILY_LIMIT is raised.
const DEFAULT_DAILY_LIMIT = 32;

export function isPlacesConfigured(env) {
  return Boolean(env.GOOGLE_PLACES_API_KEY);
}

async function placesFetch(env, path, init, fieldMask) {
  const response = await fetch(`${PLACES_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': env.GOOGLE_PLACES_API_KEY,
      'X-Goog-FieldMask': fieldMask,
      ...init?.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error(JSON.stringify({ message: 'Places API error', status: response.status, error: payload.error?.message }));
    throw new ApiError(502, 'GOOGLE_REVIEWS_UNAVAILABLE', 'Google reviews could not be loaded right now.');
  }
  return payload;
}

/** Looks up and stores the branch's place ID (IDs-only Text Search; place IDs may be stored). */
async function resolvePlaceId(env, branch) {
  if (branch.google_place_id) return branch.google_place_id;
  const payload = await placesFetch(env, '/places:searchText', {
    method: 'POST',
    body: JSON.stringify({ textQuery: `Abi Skin and Hair Clinic, ${branch.address}`, pageSize: 1 }),
  }, 'places.id');
  const placeId = payload.places?.[0]?.id;
  if (!placeId) throw new ApiError(404, 'PLACE_NOT_FOUND', 'This clinic was not found on Google Maps.');
  await env.DB.prepare('UPDATE branches SET google_place_id = ? WHERE id = ?').bind(placeId, branch.id).run();
  return placeId;
}

/**
 * Live Google rating and up to five Google-selected reviews. Google's terms forbid storing
 * review content, so every call goes to Google and the response is never cached.
 */
export async function getGoogleReviews(env, request, branchId) {
  if (!isPlacesConfigured(env)) {
    throw new ApiError(503, 'GOOGLE_REVIEWS_NOT_CONFIGURED', 'Google reviews are not configured.');
  }
  const branch = await env.DB.prepare(`
    SELECT id, name, address, google_place_id FROM branches WHERE id = ? AND active = 1
  `).bind(branchId).first();
  if (!branch) throw new ApiError(404, 'BRANCH_NOT_FOUND', 'Clinic branch was not found.');

  await enforceRateLimit(env.DB, request, 'google-reviews', 6, 60 * 60);
  const dailyLimit = Number(env.GOOGLE_PLACES_DAILY_LIMIT) || DEFAULT_DAILY_LIMIT;
  await enforceDailyBudget(env.DB, dailyLimit);

  const placeId = await resolvePlaceId(env, branch);
  const place = await placesFetch(
    env,
    `/places/${encodeURIComponent(placeId)}?languageCode=en`,
    { method: 'GET' },
    'rating,userRatingCount,googleMapsUri,reviews',
  );
  return {
    branchId: branch.id,
    branchName: branch.name,
    rating: place.rating ?? null,
    count: place.userRatingCount ?? 0,
    googleMapsUri: place.googleMapsUri || null,
    reviews: (place.reviews || []).map((review) => ({
      rating: review.rating,
      text: review.text?.text || review.originalText?.text || '',
      relativeTime: review.relativePublishTimeDescription || '',
      author: review.authorAttribution?.displayName || 'Google user',
      authorUri: review.authorAttribution?.uri || null,
      authorPhoto: review.authorAttribution?.photoUri || null,
      googleMapsUri: review.googleMapsUri || place.googleMapsUri || null,
    })),
  };
}

async function enforceDailyBudget(db, limit) {
  const windowStart = Math.floor(Date.now() / 1000 / 86_400) * 86_400;
  const row = await db.prepare(`
    INSERT INTO rate_limits (bucket, window_start, count) VALUES ('google-places:all', ?, 1)
    ON CONFLICT(bucket, window_start) DO UPDATE SET count = count + 1
    RETURNING count
  `).bind(windowStart).first();
  if (Number(row?.count || 0) > limit) {
    throw new ApiError(429, 'GOOGLE_REVIEWS_DAILY_LIMIT', 'Google reviews are paused for today. Please view them on Google Maps.');
  }
}
