import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services from './components/Services';
import About from './components/About';
import BranchInfo from './components/BranchInfo';
import Booking from './components/Booking';
import Footer from './components/Footer';
import PitchDeck from './components/PitchDeck';
import Facilities from './components/Facilities';
import exteriorImg from './assets/clinic_exterior.png';
import treatmentImg from './assets/clinic_treatment_room.png';
import { Target, Calendar, Award, ShieldCheck, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

function App() {
  const [darkTheme, setDarkTheme] = useState(false);
  const [activeView, setActiveView] = useState('website'); // 'website' or 'pitch'

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
        activeView={activeView} 
        setActiveView={setActiveView} 
      />

      {activeView === 'website' ? (
        <>
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
                Equipped with FDA-approved laser technologies, advanced clinical facilities, and personal medical attention from Dr. Srinivasan G.
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

          {/* Integrated Pitch Section: "Why do you need a website?" */}
          <section className="py-24 px-6 relative overflow-hidden text-white">
            {/* Background Photo with Dark Tint */}
            <div className="absolute inset-0 z-0">
              <img 
                src={exteriorImg} 
                alt="ABI Clinic Premises" 
                className="w-full h-full object-cover object-center filter contrast-105"
              />
              <div className="absolute inset-0 bg-slate-950/85" />
            </div>
            
            <div className="max-w-5xl mx-auto relative z-10">
              
              <div className="text-center mb-16">
                <span className="text-xs font-extrabold text-teal-400 uppercase tracking-widest bg-teal-500/10 border border-teal-500/20 px-3 py-1 rounded-full inline-block mb-3">
                  Strategic Proposal
                </span>
                <h2 className="text-3xl sm:text-5xl font-extrabold mb-4 text-white">
                  Why does ABI Skin & Hair Clinic need a website?
                </h2>
                <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base font-semibold leading-relaxed">
                  "I am not interested in technology and don't understand these stuffs" — That's why this platform is built to run 100% on autopilot, acting as a quiet assistant for your practice.
                </p>
              </div>

              {/* Pitch Core Arguments */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                
                {/* Point 1 */}
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
                    <Target className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-white">1. Stop Phone Interruptions</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                    Free up your receptionist. Timings, addresses, and directions are answered automatically online, reducing repeat phone calls by up to 45% so your staff can focus on the patients sitting in front of you.
                  </p>
                </div>

                {/* Point 2 */}
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-white">2. Own Your Name Online</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                    Lock out competitor listings. Generic directories (Justdial, Indiamart) display advertisements for other clinics directly on your profile. A custom site guarantees patients see only Dr. Srinivasan.
                  </p>
                </div>

                {/* Point 3 */}
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
                    <Award className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-white">3. Drive Aesthetic Clients</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                    Capture high-value procedures. Patients shopping for premium treatments (PRP, lasers, peels) search online. If they don't see your clinical site, they travel to larger cities instead.
                  </p>
                </div>

              </div>

              {/* Action Button */}
              <div className="text-center">
                <button
                  onClick={() => setActiveView('pitch')}
                  className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-8 py-3.5 rounded-2xl font-bold transition-all shadow-md shadow-amber-500/10 hover:shadow-amber-500/20 cursor-pointer text-sm"
                >
                  <span>Launch Tailored Pitch Presentation</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          </section>

          <BranchInfo />
          
          <Booking />
          
          <Footer />
        </>
      ) : (
        /* Pitch Presentation Mode */
        <div className="min-h-[80vh] flex flex-col justify-between py-12">
          <PitchDeck />
          <div className="text-center pt-8 border-t border-slate-200 dark:border-slate-800 max-w-xl mx-auto w-full px-4 text-xs font-bold text-slate-400">
            ABI SKIN & HAIR CARE CLINIC • DIGITAL ROADMAP
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
