import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, LoaderCircle, MessageSquareQuote, ShieldCheck, Star } from 'lucide-react';
import { api, getPublicBootstrap } from '../lib/api';

export default function Reviews() {
  const [data, setData] = useState({ reviews: [], rating: { average: null, count: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
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
    try {
      await api('/api/public/reviews', {
        method: 'POST',
        body: JSON.stringify({ ...form, token }),
      });
      setSubmitted(true);
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
        </div>

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
              <div className="text-center py-6"><CheckCircle2 className="w-12 h-12 text-teal-600 mx-auto" /><h3 className="mt-4 text-xl font-bold">Thank you for your review</h3><p className="mt-2 text-sm text-slate-500">It will appear publicly after moderation.</p></div>
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
