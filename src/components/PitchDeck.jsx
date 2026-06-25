import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Smartphone, Calendar, ShieldCheck, 
  Award, BarChart3, ChevronRight, ChevronLeft, 
  Target, Sparkles, Globe, UserCheck, AlertCircle,
  Clock, ShieldAlert, Cpu
} from 'lucide-react';

const SLIDES = [
  {
    id: 1,
    title: 'The Autopilot Clinic Assistant',
    subtitle: 'Increasing efficiency and high-value bookings with zero technical effort from you.',
    icon: Cpu,
    bgColor: 'from-slate-900 via-slate-950 to-slate-900',
    content: (
      <div className="space-y-6 text-center max-w-2xl mx-auto">
        <motion.div 
          animate={{ scale: [1, 1.03, 1] }} 
          transition={{ repeat: Infinity, duration: 5 }}
          className="w-20 h-20 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center mx-auto mb-6 border border-teal-500/20"
        >
          <Sparkles className="w-10 h-10" />
        </motion.div>
        <h3 className="text-3xl sm:text-4xl font-extrabold text-white">ABI SKIN & HAIR CLINIC</h3>
        <p className="text-slate-355 text-sm sm:text-base leading-relaxed">
          A customized digital strategy for <strong>Dr. Srinivasan G.</strong>, designed to run entirely in the background, requiring <strong>no tech knowledge or daily management</strong>.
        </p>
        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/30 text-teal-400 text-xs font-bold uppercase tracking-wider inline-block">
          Focus: Operational Relief & High-Value Patients
        </div>
      </div>
    )
  },
  {
    id: 2,
    title: '1. Zero Technical Headaches',
    subtitle: 'Operates Exactly Like Clinical Equipment',
    icon: ShieldCheck,
    bgColor: 'from-slate-900 to-slate-950',
    content: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-4xl mx-auto text-left">
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 w-fit">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-2xl font-bold text-white">"I am not interested in technology"</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-medium">
            You don't need to check dashboards, edit files, or touch a computer. We set it up, secure it, and let it run on autopilot.
          </p>
          <ul className="space-y-2 text-xs text-slate-450 font-semibold">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
              <span><strong>Auto-Maintenance:</strong> Security & database updates are handled externally.</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
              <span><strong>Turnkey Solution:</strong> Ready to function in the background, like a medical laser.</span>
            </li>
          </ul>
        </div>
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-850 space-y-4">
          <h4 className="font-bold text-teal-400 text-xs uppercase tracking-wider">Passive Operational Asset</h4>
          <p className="text-xs text-slate-400 leading-relaxed font-medium">
            Just as you trust diagnostic equipment to run without needing to rebuild the circuits, this website is calibrated once and generates value passively.
          </p>
          <div className="p-3 rounded-xl bg-teal-950/20 border border-teal-900/30 text-xs font-bold text-teal-300 text-center">
            Zero time taken from your medical practice.
          </div>
        </div>
      </div>
    )
  },
  {
    id: 3,
    title: '2. Stop Telephone Interruption',
    subtitle: 'Frees Up Your Receptionist from Repeat Calls',
    icon: Clock,
    bgColor: 'from-slate-900 to-teal-950',
    content: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-4xl mx-auto text-left">
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-850 space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-teal-400">Typical Receptionist Time Wastage</div>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between font-bold text-slate-450">
              <span>"Where is the clinic located?"</span>
              <span className="text-red-400">20% of calls</span>
            </div>
            <div className="flex justify-between font-bold text-slate-450">
              <span>"Is Velayuthampalayam open tonight?"</span>
              <span className="text-red-400">25% of calls</span>
            </div>
            <div className="flex justify-between font-bold text-slate-450">
              <span>"Can I book a consultation?"</span>
              <span className="text-teal-450">55% of calls</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
            A website resolves the location and timings queries automatically, reducing phone interruptions by up to 45%.
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 w-fit">
            <Smartphone className="w-5 h-5" />
          </div>
          <h3 className="text-2xl font-bold text-white">Answering FAQs On Autopilot</h3>
          <p className="text-sm text-slate-400 leading-relaxed font-medium">
            Your receptionist is busy checking in physical patients. The website acts as a digital assistant, answering route directions, timings, and credentials 24/7.
          </p>
          <ul className="space-y-2 text-xs text-slate-450 font-semibold">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
              <span>Patients check Velayuthampalayam map route directly.</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
              <span>Reduces staff overhead and phone line busy bottlenecks.</span>
            </li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 4,
    title: '3. Lock Down Your Brand Name',
    subtitle: 'Prevent Competitors from Siphoning Patients',
    icon: ShieldAlert,
    bgColor: 'from-slate-900 to-slate-950',
    content: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-4xl mx-auto text-left">
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 w-fit">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h3 className="text-2xl font-bold text-white">Third-Party Directory Leakage</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-medium">
            When patients search for "Abi Skin Clinic Karur", directories like Justdial show sponsored ads of <strong>competing skin clinics</strong> on your profile.
          </p>
          <ul className="space-y-2 text-xs text-slate-450 font-semibold">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              <span>Competing doctors can pay to rank above you on your name search.</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              <span>A custom website secures your patient search with 0% competitor ads.</span>
            </li>
          </ul>
        </div>
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 text-center">
          <div className="text-xs font-bold text-red-400 uppercase tracking-widest">Without Your Own Website:</div>
          <div className="text-base text-white font-bold leading-normal bg-slate-950/45 p-4 rounded-xl border border-red-550/20">
            Patients are redirected to corporate clinics who buy ad space on directory boards.
          </div>
          <div className="text-xs text-teal-400 font-bold">
            Ownership of abiskinclinic.com prevents brand hijacking.
          </div>
        </div>
      </div>
    )
  },
  {
    id: 5,
    title: '4. Cosmetic Procedure Growth',
    subtitle: 'Capturing High-Margin Choice-Driven Clients',
    icon: TrendingUp,
    bgColor: 'from-slate-900 to-teal-950',
    content: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-4xl mx-auto text-left">
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-850 space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-500">Clinical Fees vs. Aesthetic Margins</div>
          <p className="text-xs text-slate-400 leading-relaxed font-medium">
            Traditional skin consultations have fixed fees. However, cosmetic lasers, Hydrafacials, chemical peels, and hair growth PRP treatments have high margins.
          </p>
          <div className="p-3 rounded-xl bg-teal-950/20 border border-teal-900/35 text-xs text-teal-300 font-bold text-center">
            Aesthetic clients choose clinics with high-quality visual websites.
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 w-fit">
            <Target className="w-5 h-5" />
          </div>
          <h3 className="text-2xl font-bold text-white">Attracting Premium Bookings</h3>
          <p className="text-sm text-slate-450 leading-relaxed font-medium">
            Cosmetic patients search and compare online. If they don't find a dedicated website for ABI Clinic, they travel to cities like Coimbatore or Trichy for lasers.
          </p>
          <ul className="space-y-2 text-xs text-slate-400 font-semibold">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              <span>Showcases your high-end clinical setups and lasers.</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              <span>Converts general inquiries into premium aesthetic bookings.</span>
            </li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 6,
    title: 'The Investment Math',
    subtitle: 'Zero Overhead. High Yield.',
    icon: Target,
    bgColor: 'from-slate-900 via-slate-950 to-slate-900',
    content: (
      <div className="space-y-6 max-w-2xl mx-auto text-left">
        <h3 className="text-2xl font-extrabold text-white text-center">Instant Return on Investment (ROI)</h3>
        
        <div className="p-6 rounded-2xl bg-teal-950/10 border border-teal-900/30 space-y-4 text-center">
          <p className="text-sm text-slate-350 leading-relaxed font-medium">
            We manage the site completely. You do not hire digital teams or learn tech.
          </p>
          <div className="text-3xl font-extrabold text-teal-400">1-2 Bookings / Month</div>
          <p className="text-xs font-bold text-slate-450 uppercase tracking-wider">Pays for the annual hosting cost entirely</p>
          <div className="text-xs text-slate-400 text-left bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
            <strong>The Bottom Line:</strong> The website acts as a quiet clinical assistant. It answers maps, schedules patient slots, showcases Dr. Srinivasan's DD credentials, and siphons cosmetic clients—running 100% on autopilot.
          </div>
        </div>
      </div>
    )
  }
];

export default function PitchDeck() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide]);

  const slide = SLIDES[currentSlide];
  const IconComp = slide.icon;

  return (
    <div className="py-12 px-4 max-w-5xl mx-auto">
      
      {/* Pitch Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Business Proposal Pitch</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold mt-1">
          Why ABI Skin & Hair Clinic Needs an Independent Website Platform
        </p>
      </div>

      {/* Presentation Container */}
      <div className={`rounded-3xl bg-gradient-to-br ${slide.bgColor} border border-slate-800/80 shadow-2xl relative min-h-[480px] p-6 sm:p-12 flex flex-col justify-between overflow-hidden transition-all duration-550`}>
        
        {/* Decorative Grid backdrop */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-10 pointer-events-none" />

        {/* Slide Top Details */}
        <div className="relative z-10 flex justify-between items-start border-b border-slate-800/60 pb-5 mb-8">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-400">
              Slide {currentSlide + 1} of {SLIDES.length}
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
              {slide.title}
            </h3>
            <p className="text-xs text-slate-450 font-medium mt-1">
              {slide.subtitle}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <IconComp className="w-5 h-5" />
          </div>
        </div>

        {/* Slide Core Content */}
        <div className="relative z-10 my-auto flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="w-full"
            >
              {slide.content}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Slide Controls Footer */}
        <div className="relative z-10 flex justify-between items-center border-t border-slate-800/60 pt-6 mt-8">
          {/* Progress Indicators */}
          <div className="flex gap-1.5">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentSlide ? 'w-6 bg-teal-400' : 'w-1.5 bg-slate-800 hover:bg-slate-700'
                }`}
                title={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          {/* Navigation Arrows */}
          <div className="flex gap-2">
            <button
              onClick={handlePrev}
              disabled={currentSlide === 0}
              className={`p-2 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-350 hover:bg-slate-850 hover:text-white transition-colors cursor-pointer ${
                currentSlide === 0 ? 'opacity-40 cursor-not-allowed' : ''
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              disabled={currentSlide === SLIDES.length - 1}
              className={`p-2 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-350 hover:bg-slate-850 hover:text-white transition-colors cursor-pointer ${
                currentSlide === SLIDES.length - 1 ? 'opacity-40 cursor-not-allowed' : ''
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

      </div>

      {/* Quick notice */}
      <div className="text-center text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-widest">
        *Use left / right keyboard arrows to navigate slide deck
      </div>

    </div>
  );
}
