import { useState, useEffect } from 'react';
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
import AdminDashboard from './components/AdminDashboard';
import treatmentImg from './assets/clinic_treatment_room.png';

function App() {
  const [darkTheme, setDarkTheme] = useState(false);
  const [showLookup, setShowLookup] = useState(() => window.location.hash === '#track');
  const isAdminRoute = window.location.pathname.startsWith('/admin');

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

  if (isAdminRoute) return <AdminDashboard />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* Header / Navbar */}
      <Navbar 
        darkTheme={darkTheme} 
        setDarkTheme={setDarkTheme}
        onOpenLookup={() => setShowLookup(true)}
      />

      {/* Main Website Sections */}
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
            alt="Clinic Treatment Suite" 
            className="w-full h-full object-cover object-center filter saturate-75"
          />
          <div className="absolute inset-0 bg-slate-950/80" />
        </div>
        <div className="max-w-3xl mx-auto relative z-10 space-y-6">
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white">
            Doctor-led Clinical Care
          </h3>
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
