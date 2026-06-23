import { Moon, Sun, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Navbar({ darkTheme, setDarkTheme, activeView, setActiveView }) {
  return (
    <motion.nav 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 w-full px-6 py-4 glass shadow-sm transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo Monogram */}
        <a 
          href="#home" 
          onClick={() => setActiveView('website')}
          className="flex items-center gap-3 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center font-serif text-lg font-bold tracking-tighter shadow-md transition-transform group-hover:scale-105">
            A
          </div>
          <div className="text-left">
            <span className="block font-extrabold text-base tracking-tight text-slate-900 dark:text-white -mb-1">
              ABI SKIN & HAIR
            </span>
            <span className="block text-[9px] uppercase font-bold tracking-widest text-teal-600 dark:text-teal-400">
              Care Clinic
            </span>
          </div>
        </a>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          {activeView === 'website' ? (
            <>
              <a href="#services" className="font-semibold text-sm text-slate-600 dark:text-slate-350 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                Treatments
              </a>
              <a href="#about" className="font-semibold text-sm text-slate-600 dark:text-slate-350 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                The Doctor
              </a>
              <a href="#facilities" className="font-semibold text-sm text-slate-600 dark:text-slate-350 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                Our Facilities
              </a>
              <a href="#branches" className="font-semibold text-sm text-slate-600 dark:text-slate-350 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                Branches & Hours
              </a>
              <a href="#book" className="font-semibold text-sm text-slate-600 dark:text-slate-350 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                Book Visit
              </a>
            </>
          ) : (
            <span className="text-xs font-bold py-1 px-3 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 rounded-full border border-teal-200/50 dark:border-teal-800/40 uppercase tracking-wider">
              Strategic Proposal Mode
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Pitch Switcher */}
          <button
            onClick={() => setActiveView(activeView === 'website' ? 'pitch' : 'website')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm ${
              activeView === 'pitch' 
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/10' 
                : 'bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 hover:bg-teal-100/70 dark:hover:bg-teal-950/70 border border-teal-200/30 dark:border-teal-900/30'
            }`}
          >
            {activeView === 'website' ? (
              <>
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Proposal Pitch</span>
              </>
            ) : (
              <>
                <span>Back to Clinic Site</span>
              </>
            )}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setDarkTheme(!darkTheme)}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
            aria-label="Toggle theme"
          >
            {darkTheme ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Booking Shortcut Button */}
          {activeView === 'website' && (
            <a
              href="#book"
              className="hidden lg:flex items-center gap-1 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-teal-600/15 hover:shadow-teal-600/25 transition-all text-xs uppercase tracking-wider"
            >
              Book Appointment
            </a>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
