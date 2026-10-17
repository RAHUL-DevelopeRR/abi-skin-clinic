// Short review link for SMS (abiskinandhaircare.in/r/karur) that redirects to the
// clinic's Google review page, keeping the patient SMS within one 160-character message.
export async function onRequestGet(context) {
  const branchId = String(context.params.branch || '');
  const fallback = new URL('/#reviews', context.request.url).toString();
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(branchId) || !context.env.DB) return Response.redirect(fallback, 302);
  const branch = await context.env.DB
    .prepare('SELECT google_review_url FROM branches WHERE id = ? AND active = 1')
    .bind(branchId)
    .first();
  return Response.redirect(branch?.google_review_url || fallback, 302);
}
