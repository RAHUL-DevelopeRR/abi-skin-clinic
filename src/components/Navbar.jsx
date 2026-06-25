import { useState } from 'react';
import { Moon, Sun, Menu, X, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ClinicLogo from './ClinicLogo';

export default function Navbar({ darkTheme, setDarkTheme }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.nav 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 w-full px-6 py-4 glass shadow-sm transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          {/* Logo Monogram & Branding */}
          <a 
            href="#home" 
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 group cursor-pointer"
          >
            <ClinicLogo className="w-10 h-12 -mt-1 group-hover:scale-105 transition-transform" />
            <div className="text-left">
              <span className="block font-extrabold text-base tracking-tight text-slate-900 dark:text-white -mb-1">
                ABI SKIN & HAIR
              </span>
              <span className="block text-[9px] uppercase font-bold tracking-widest text-teal-600 dark:text-teal-400">
                Care Clinic
              </span>
            </div>
          </a>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
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
          </div>

          {/* Desktop Actions */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={() => setDarkTheme(!darkTheme)}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
              aria-label="Toggle theme"
            >
              {darkTheme ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
              aria-label="Toggle navigation drawer"
            >
              {isOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
            </button>

            {/* Booking Shortcut Button */}
            <a
              href="#book"
              className="hidden lg:flex items-center gap-1 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-teal-600/15 hover:shadow-teal-600/25 transition-all text-xs uppercase tracking-wider"
            >
              Book Appointment
            </a>
          </div>
        </div>

        {/* Mobile Dropdown Panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden mt-4 pt-4 border-t border-slate-200/40 dark:border-slate-800/40 flex flex-col gap-3.5 text-left"
            >
              <a 
                href="#services" 
                onClick={() => setIsOpen(false)}
                className="font-bold text-sm text-slate-600 dark:text-slate-350 hover:text-teal-600 dark:hover:text-teal-400 py-1 transition-colors"
              >
                Treatments
              </a>
              <a 
                href="#about" 
                onClick={() => setIsOpen(false)}
                className="font-bold text-sm text-slate-600 dark:text-slate-350 hover:text-teal-600 dark:hover:text-teal-400 py-1 transition-colors"
              >
                The Doctor
              </a>
              <a 
                href="#facilities" 
                onClick={() => setIsOpen(false)}
                className="font-bold text-sm text-slate-600 dark:text-slate-350 hover:text-teal-600 dark:hover:text-teal-400 py-1 transition-colors"
              >
                Our Facilities
              </a>
              <a 
                href="#branches" 
                onClick={() => setIsOpen(false)}
                className="font-bold text-sm text-slate-600 dark:text-slate-350 hover:text-teal-600 dark:hover:text-teal-400 py-1 transition-colors"
              >
                Branches & Hours
              </a>
              <a 
                href="#book" 
                onClick={() => setIsOpen(false)}
                className="font-bold text-sm text-slate-600 dark:text-slate-350 hover:text-teal-600 dark:hover:text-teal-400 py-1 transition-colors flex items-center gap-1.5"
              >
                <Calendar className="w-4 h-4 text-teal-650" />
                <span>Book Appointment</span>
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
