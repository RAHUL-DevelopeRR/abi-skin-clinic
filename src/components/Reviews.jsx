import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, LoaderCircle, MessageSquareQuote, ShieldCheck, Star } from 'lucide-react';
import { api, getPublicBootstrap } from '../lib/api';
import GoogleReviews from './GoogleReviews';

export default function Reviews() {
  const [data, setData] = useState({ reviews: [], rating: { average: null, count: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(null);
  const [form, setForm] = useState({ name: '', rating: 5, comment: '', consent: false });
  const token = useMemo(() => new URLSearchParams(window.location.search).get('review'), []);

  useEffect(() => {
    let active = true;
    getPublicBootstrap()
      .then((result) => active && setData(result))
      .catch((requestError) => active && setError(requestError.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    // Copy while the tap still counts as a user gesture so the text can be pasted on Google.
    const copying = navigator.clipboard?.writeText(form.comment).then(() => true, () => false) ?? Promise.resolve(false);
    try {
      const result = await api('/api/public/reviews', {
        method: 'POST',
        body: JSON.stringify({ ...form, token }),
      });
      const textCopied = await copying;
      setSubmitted({ ...result, textCopied, comment: form.comment });
      // In-app browsers often block the clipboard; then the patient stays here to copy the text first.
      if (result.googleReviewUrl && textCopied) {
        window.setTimeout(() => window.location.assign(result.googleReviewUrl), 3000);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="reviews" className="py-24 px-6 bg-white dark:bg-slate-950">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-sm font-extrabold text-teal-600 uppercase tracking-widest block mb-3">Verified patient feedback</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white">Patient Reviews</h2>
          {Number(data.rating?.count) > 0 ? (
            <p className="mt-4 text-slate-500 font-semibold">{data.rating.average} out of 5 from {data.rating.count} approved verified {Number(data.rating.count) === 1 ? 'review' : 'reviews'}.</p>
          ) : (
            <p className="mt-4 text-slate-500 font-semibold">Reviews appear here only after a completed appointment and clinic moderation.</p>
          )}
          {data.branches?.some((branch) => branch.google_review_url) && (
            <p className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm">
              <span className="text-slate-500">Google reviews:</span>
              {data.branches.filter((branch) => branch.google_review_url).map((branch) => (
                <a key={branch.id} href={branch.google_review_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-600 hover:underline">{branch.name}</a>
              ))}
            </p>
          )}
        </div>

        {data.googleReviews && data.branches?.length > 0 && <GoogleReviews branches={data.branches} />}

        {data.reviews?.length > 0 && (
          <div className="grid md:grid-cols-3 gap-5 mb-12">
            {data.reviews.map((review) => (
              <article key={review.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-6">
                <div className="flex gap-1 text-amber-500" aria-label={`${review.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }, (_, index) => <Star key={index} className={`w-4 h-4 ${index < review.rating ? 'fill-current' : 'opacity-20'}`} />)}
                </div>
                <blockquote className="mt-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">“{review.comment}”</blockquote>
                <footer className="mt-4 text-xs font-bold text-slate-500">{review.patient_name} · Verified appointment</footer>
              </article>
            ))}
          </div>
        )}

        {token ? (
          <div className="max-w-2xl mx-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-6 sm:p-8">
            {submitted ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-12 h-12 text-teal-600 mx-auto" />
                <h3 className="mt-4 text-xl font-bold">Thank you for your review</h3>
                <p className="mt-2 text-sm text-slate-500">It will appear here after moderation.</p>
                {submitted.googleReviewUrl && (
                  <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5">
                    {submitted.textCopied ? <>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Taking you to Google reviews{submitted.branchName ? ` for ${submitted.branchName}` : ''}…</p>
                      <p className="mt-1 text-xs text-slate-500">Your review text is copied. Tap “Write a review” on Google and paste it.</p>
                    </> : <>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Please also post it on Google{submitted.branchName ? ` for ${submitted.branchName}` : ''}</p>
                      <p className="mt-1 text-xs text-slate-500">Copy your review below, then tap the button and choose “Write a review”.</p>
                      <p className="mt-3 select-all rounded-xl bg-slate-50 p-3 text-left text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-200">{submitted.comment}</p>
                    </>}
                    <a href={submitted.googleReviewUrl} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-white px-5 py-3 text-sm font-bold text-white dark:text-slate-950"><Star className="w-4 h-4 fill-amber-400 text-amber-400" />Review us on Google</a>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={submit}>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><MessageSquareQuote className="text-teal-600" />Share your experience</h3>
                <p className="mt-2 text-xs text-slate-500">Do not include diagnoses, phone numbers, or other private health information.</p>
                <label className="block mt-5 text-xs font-bold uppercase text-slate-500">Display name
                  <input required minLength="2" maxLength="80" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="mt-2 w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 normal-case" />
                </label>
                <fieldset className="mt-5"><legend className="text-xs font-bold uppercase text-slate-500">Rating</legend><div className="mt-2 flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => <button key={rating} type="button" onClick={() => setForm((current) => ({ ...current, rating }))} aria-label={`${rating} stars`} className={`p-2 rounded-lg ${rating <= form.rating ? 'text-amber-500 bg-amber-50' : 'text-slate-300 bg-white'}`}><Star className="w-5 h-5 fill-current" /></button>)}
                </div></fieldset>
                <label className="block mt-5 text-xs font-bold uppercase text-slate-500">Review
                  <textarea required minLength="20" maxLength="800" rows="4" value={form.comment} onChange={(event) => setForm((current) => ({ ...current, comment: event.target.value }))} className="mt-2 w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 normal-case resize-none" />
                </label>
                <label className="mt-4 flex gap-3 text-xs text-slate-600 dark:text-slate-300"><input required type="checkbox" checked={form.consent} onChange={(event) => setForm((current) => ({ ...current, consent: event.target.checked }))} /><span>I consent to this review and display name being published after moderation.</span></label>
                {error && <p role="alert" className="mt-4 text-sm text-red-600 flex gap-2"><AlertCircle className="w-4 h-4" />{error}</p>}
                <button disabled={loading} className="mt-6 inline-flex items-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-xl font-bold text-sm disabled:opacity-50">{loading ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}Submit verified review</button>
              </form>
            )}
          </div>
        ) : (
          <div className="text-center text-xs text-slate-500 flex items-center justify-center gap-2"><ShieldCheck className="w-4 h-4 text-teal-600" />Completed patients receive a secure, single-use review invitation from the clinic.</div>
        )}
        {error && !token && <p role="alert" className="mt-6 text-center text-sm text-red-600">{error}</p>}
      </div>
    </section>
  );
}
