import { useState } from 'react';
import { ExternalLink, LoaderCircle, Star } from 'lucide-react';
import { api } from '../lib/api';

function Stars({ rating, className = 'w-4 h-4' }) {
  return <span className="inline-flex gap-0.5 text-amber-500" aria-label={`${rating} out of 5 stars`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} className={`${className} ${index < Math.round(rating) ? 'fill-current' : 'opacity-20'}`} />)}</span>;
}

/**
 * Live Google rating and reviews from the Places API. Loaded only when a visitor asks,
 * because every load is a paid Google request (the server caps them to stay in the free tier).
 */
export default function GoogleReviews({ branches }) {
  const [results, setResults] = useState({});
  // Tracked per branch: each load is a paid Google request, so a branch already loading must
  // stay disabled while another branch loads.
  const [loading, setLoading] = useState({});
  const [error, setError] = useState('');

  async function show(branchId) {
    if (results[branchId] || loading[branchId]) return;
    setError('');
    setLoading((current) => ({ ...current, [branchId]: true }));
    try {
      const data = await api(`/api/public/google-reviews?branch=${encodeURIComponent(branchId)}`);
      setResults((current) => ({ ...current, [branchId]: data }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading((current) => ({ ...current, [branchId]: false }));
    }
  }

  return (
    <div className="max-w-6xl mx-auto mb-12 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-6 sm:p-8">
      <h3 className="text-xl font-bold text-slate-900 dark:text-white">Reviews on Google</h3>
      <div className="mt-4 flex flex-wrap gap-2">
        {branches.map((branch) => (
          <button key={branch.id} type="button" onClick={() => show(branch.id)} disabled={Boolean(loading[branch.id])} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${results[branch.id] ? 'bg-teal-600 text-white' : 'bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800'}`}>
            {loading[branch.id] && <LoaderCircle className="w-4 h-4 animate-spin" />}Show Google reviews · {branch.name}
          </button>
        ))}
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
      {branches.filter((branch) => results[branch.id]).map((branch) => {
        const data = results[branch.id];
        return (
          <section key={branch.id} className="mt-6">
            <div className="flex flex-wrap items-center gap-3">
              <strong className="text-slate-900 dark:text-white">{data.branchName}</strong>
              {data.rating && <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{data.rating.toFixed(1)} <Stars rating={data.rating} /> · {data.count} Google reviews</span>}
            </div>
            <div className="mt-4 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.reviews.map((review, index) => (
                <article key={`${review.author}-${index}`} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5">
                  <header className="flex items-center gap-3">
                    {review.authorPhoto && <img src={review.authorPhoto} alt="" referrerPolicy="no-referrer" loading="lazy" className="w-9 h-9 rounded-full" />}
                    <div className="min-w-0">
                      {review.authorUri
                        ? <a href={review.authorUri} target="_blank" rel="noopener noreferrer" className="block truncate text-sm font-bold text-slate-900 dark:text-white hover:underline">{review.author}</a>
                        : <span className="block truncate text-sm font-bold">{review.author}</span>}
                      <span className="text-xs text-slate-500">{review.relativeTime}</span>
                    </div>
                  </header>
                  <div className="mt-3"><Stars rating={review.rating} className="w-3.5 h-3.5" /></div>
                  {review.text && <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-6">{review.text}</p>}
                  {review.googleMapsUri && <a href={review.googleMapsUri} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-teal-600">View on Google Maps <ExternalLink className="w-3 h-3" /></a>}
                </article>
              ))}
            </div>
            <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
              <span>Reviews from Google</span>
              {data.googleMapsUri && <a href={data.googleMapsUri} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-600 hover:underline">See all reviews on Google Maps</a>}
              {branch.google_review_url && <a href={branch.google_review_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-600 hover:underline">Write a Google review</a>}
            </p>
          </section>
        );
      })}
    </div>
  );
}
