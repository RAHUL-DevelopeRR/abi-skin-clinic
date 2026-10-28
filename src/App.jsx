import { lazy, Suspense, useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services from './components/Services';
import About from './components/About';
import Facilities from './components/Facilities';
import ClinicVideos from './components/ClinicVideos';
import BranchInfo from './components/BranchInfo';
import Booking from './components/Booking';
import Reviews from './components/Reviews';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import AppointmentLookup from './components/AppointmentLookup';
import treatmentImg from './assets/cta-treatment-room-1024.webp';

// The doctor dashboard and its Capacitor plugins load only on /admin, outside the public page's bundle.
const AdminDashboard = lazy(() => import('./components/AdminDashboard').catch(() => ({
  // A failed download (a flaky network in the doctor app) offers a retry instead of a blank screen.
  default: function AdminLoadFailed() {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="font-semibold">The dashboard could not be loaded.</p>
        <button onClick={() => window.location.reload()} className="rounded-xl bg-teal-600 px-5 py-3 text-sm font-bold text-white">Retry</button>
      </div>
    );
  },
})));

// The build also renders this page in Node (scripts/prerender.js), where there is no window.
const isBrowser = typeof window !== 'undefined';

function App() {
  const [darkTheme, setDarkTheme] = useState(false);
  const [showLookup, setShowLookup] = useState(() => isBrowser && window.location.hash === '#track');
  const isAdminRoute = isBrowser && window.location.pathname.startsWith('/admin');

  // The SMS "track" link (/#track) can open in a tab already on the site, which changes only the hash.
  useEffect(() => {
    const openLookupFromHash = () => { if (window.location.hash === '#track') setShowLookup(true); };
    window.addEventListener('hashchange', openLookupFromHash);
    return () => window.removeEventListener('hashchange', openLookupFromHash);
  }, []);

  // Apply theme class to document element
  useEffect(() => {
    if (darkTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkTheme]);

  if (isAdminRoute) return <Suspense fallback={null}><AdminDashboard /></Suspense>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* Header / Navbar */}
      <Navbar 
        darkTheme={darkTheme} 
        setDarkTheme={setDarkTheme}
        onOpenLookup={() => setShowLookup(true)}
      />

      {/* Main Website Sections */}
      <main>
      <Hero onOpenLookup={() => setShowLookup(true)} />
      
      <Services />
      
      <About />

      <Facilities />

      <ClinicVideos />

      {/* Full-width Call to Action Banner */}
      <section className="py-24 px-6 relative overflow-hidden text-white text-center">
        <div className="absolute inset-0 z-0">
          <img
            src={treatmentImg}
            alt=""
            width="1024"
            height="1024"
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover object-center filter saturate-75"
          />
          <div className="absolute inset-0 bg-slate-950/80" />
        </div>
        <div className="max-w-3xl mx-auto relative z-10 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Doctor-led Clinical Care
          </h2>
          <p className="text-slate-300 text-sm sm:text-base font-semibold leading-relaxed max-w-xl mx-auto">
            Modern clinical facilities and personal medical attention from Dr. G. Srinivasan. Treatment suitability is decided after consultation.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <a 
              href="#book" 
              className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-md shadow-teal-600/10 hover:shadow-teal-600/20 text-sm cursor-pointer"
            >
              Schedule Your Consultation
            </a>
            <button
              onClick={() => setShowLookup(true)}
              className="inline-flex items-center gap-1.5 bg-slate-900/80 hover:bg-slate-900 border border-slate-700 text-white px-6 py-4 rounded-2xl font-bold transition-all text-sm cursor-pointer"
            >
              Track Appointment Status
            </button>
          </div>
        </div>
      </section>

      <BranchInfo />
      
      <Booking />

      {/* Patient Reviews Section */}
      <Reviews />

      <FAQ />
      </main>

      <Footer
        onOpenLookup={() => setShowLookup(true)}
      />

      {/* Modals */}
      <AppointmentLookup
        isOpen={showLookup}
        onClose={() => setShowLookup(false)}
      />

    </div>
  );
}

export default App;
