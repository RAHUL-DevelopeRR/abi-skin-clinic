import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services from './components/Services';
import About from './components/About';
import BranchInfo from './components/BranchInfo';
import Booking from './components/Booking';
import Footer from './components/Footer';
import Facilities from './components/Facilities';
import treatmentImg from './assets/clinic_treatment_room.png';

function App() {
  const [darkTheme, setDarkTheme] = useState(false);

  // Apply theme class to document element
  useEffect(() => {
    if (darkTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkTheme]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* Header / Navbar */}
      <Navbar 
        darkTheme={darkTheme} 
        setDarkTheme={setDarkTheme} 
      />

      {/* Main Website Sections */}
      <Hero />
      
      <Services />
      
      <About />

      <Facilities />

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
            Experience the Highest Standard of Clinical Care
          </h3>
          <p className="text-slate-300 text-sm sm:text-base font-semibold leading-relaxed max-w-xl mx-auto">
            Equipped with FDA-approved laser technologies, advanced clinical facilities, and personal medical attention from Dr. G. Srinivasan.
          </p>
          <div className="pt-2">
            <a 
              href="#book" 
              className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-md shadow-teal-600/10 hover:shadow-teal-600/20 text-sm cursor-pointer"
            >
              Schedule Your Consultation
            </a>
          </div>
        </div>
      </section>

      <BranchInfo />
      
      <Booking />
      
      <Footer />

    </div>
  );
}

export default App;
