import { useEffect, useState } from 'react';
import { CirclePlay } from 'lucide-react';
import { api } from '../lib/api';

/** Videos the doctor uploads from the dashboard. Hidden until at least one is published. */
export default function ClinicVideos() {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    api('/api/public/videos').then((result) => setVideos(result.videos || [])).catch(() => setVideos([]));
  }, []);

  if (!videos.length) return null;

  return (
    <section id="videos" className="py-24 px-6 bg-white dark:bg-slate-900/40 border-t border-slate-200/50 dark:border-slate-800/40">
      <div className="max-w-6xl mx-auto">
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-400 text-xs font-bold uppercase tracking-widest">
            <CirclePlay className="w-3.5 h-3.5" />
            Videos
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            From Dr. Srinivasan&apos;s Clinic
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base font-semibold max-w-lg mx-auto">
            Treatments, procedures and skin-care advice, explained by the clinic.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <article key={video.id} className="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shadow-sm">
              {/* #t=0.1 makes phones show a first frame instead of a black box before playing. */}
              <video
                src={`/api/public/videos/${video.id}/file#t=0.1`}
                controls
                playsInline
                preload="metadata"
                className="aspect-video w-full bg-black"
              />
              <div className="p-5">
                <h3 className="font-bold text-slate-900 dark:text-white">{video.title}</h3>
                {video.description && <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{video.description}</p>}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
