import { motion } from 'framer-motion';
import { Calendar, ArrowRight, ShieldCheck } from 'lucide-react';
import SplitText from './SplitText';
import consultationImg from '../assets/patient_consultation.png';

export default function Hero() {
  return (
    <section id="home" className="relative min-h-[85vh] flex items-center justify-center py-24 px-6 overflow-hidden">
      {/* Full-bleed background photo with dark/light responsive overlays */}
      <div className="absolute inset-0 z-0">
        <img 
          src={consultationImg} 
          alt="Dermatology Patient Consultation" 
          className="w-full h-full object-cover object-center filter saturate-75"
        />
        {/* Responsive tint overlay to ensure high readability */}
        <div className="absolute inset-0 bg-slate-50/90 dark:bg-slate-950/93 transition-colors duration-300" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-55 dark:from-slate-950 to-transparent pointer-events-none" />
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10 flex flex-col items-center">
        {/* Experience Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20 text-xs font-bold uppercase tracking-wider mb-8"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Over 20 Years of Skin & Hair Clinical Excellence</span>
        </motion.div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6 leading-[1.1] select-none">
          <SplitText text="Flawless Skin. Healthy Hair. " className="text-slate-900 dark:text-white" />
          <span className="bg-gradient-to-r from-teal-600 to-teal-400 bg-clip-text text-transparent block sm:inline mt-2">
            Expert Care.
          </span>
        </h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-base sm:text-lg md:text-xl text-slate-655 dark:text-slate-355 mb-10 max-w-2xl font-medium leading-relaxed"
        >
          Experience premium clinical dermatology, trichology, and advanced aesthetic treatments led by{' '}
          <span className="font-bold text-slate-800 dark:text-slate-100 border-b-2 border-teal-500/30">
            Dr. Srinivasan G. (MBBS, DD)
          </span>{' '}
          with over 16 years of certified medical experience.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-16"
        >
          <a
            href="#book"
            className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-teal-600/10 hover:-translate-y-0.5 transition-all w-full sm:w-auto cursor-pointer"
          >
            <Calendar className="w-5 h-5" />
            <span>Book Appointment</span>
          </a>
          <a
            href="#services"
            className="flex items-center justify-center gap-2 bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 font-bold px-8 py-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 hover:-translate-y-0.5 transition-all w-full sm:w-auto shadow-sm backdrop-blur-sm"
          >
            <span>Our Treatments</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 w-full max-w-4xl py-8 border-t border-slate-300/40 dark:border-slate-800/40"
        >
          <div>
            <span className="block text-3xl font-extrabold text-slate-950 dark:text-white">20+ Yrs</span>
            <span className="block text-xs font-bold text-slate-455 dark:text-slate-400 mt-1 uppercase tracking-wider">Local Presence</span>
          </div>
          <div>
            <span className="block text-3xl font-extrabold text-slate-950 dark:text-white">15k+</span>
            <span className="block text-xs font-bold text-slate-455 dark:text-slate-400 mt-1 uppercase tracking-wider">Happy Patients</span>
          </div>
          <div>
            <span className="block text-3xl font-extrabold text-slate-950 dark:text-white">4.8★</span>
            <span className="block text-xs font-bold text-slate-455 dark:text-slate-400 mt-1 uppercase tracking-wider">Google Rating</span>
          </div>
          <div>
            <span className="block text-3xl font-extrabold text-slate-950 dark:text-white">2</span>
            <span className="block text-xs font-bold text-slate-455 dark:text-slate-400 mt-1 uppercase tracking-wider">Branches</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
