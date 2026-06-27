import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

// Existing assets
import lobbyImg from '../assets/clinic_lobby.png';
import treatmentImg from '../assets/clinic_treatment_room.png';

// Real clinic photo assets
import realExterior2 from '../assets/clinic_real_exterior_2.jpg';
import realSignboard1 from '../assets/clinic_real_signboard_1.jpg';
import realSignboard3 from '../assets/clinic_real_signboard_3.jpg';

// Karur branch photo assets
import karurBranch1 from '../assets/karur_branch_1.jpg';
import karurBranch2 from '../assets/karur_branch_2.jpg';

const CATEGORIES = [
  { id: 'all', label: 'All Photos' },
  { id: 'karur', label: 'Karur Branch' },
  { id: 'velayuthampalayam', label: 'Velayuthampalayam Branch' },
  { id: 'general', label: 'Image Gallery' }
];

const IMAGES = [
  // Karur Branch
  {
    src: karurBranch2,
    category: 'karur',
    title: 'Karur Clinic Building Entrance',
    description: 'Dr. G. Srinivasan\'s main clinic building in Madavilagam, Karur (Timing: 9:00 AM - 2:00 PM).'
  },
  {
    src: karurBranch1,
    category: 'karur',
    title: 'ABI Clinic Health Camp',
    description: 'Free public eye & skin health check-up camp conducted by ABI Clinic team at Karur.'
  },

  // Velayuthampalayam Branch
  {
    src: realExterior2,
    category: 'velayuthampalayam',
    title: 'Velayuthampalayam Gate Entrance',
    description: 'Side frontage and entrance layout showing clinical parking space at Velayuthampalayam.'
  },
  {
    src: realSignboard1,
    category: 'velayuthampalayam',
    title: 'Velayuthampalayam Main Signboard',
    description: 'Official clinical board detailing Dr. Srinivasan G.\'s qualifications (MBBS, DD) and timings.'
  },
  {
    src: realSignboard3,
    category: 'velayuthampalayam',
    title: 'Bypass Road Directory Board',
    description: 'Street-facing signboard placed on Velayuthampalayam Bypass road to guide patients.'
  },

  // General Image Gallery (No titles/descriptions shown on cards)
  {
    src: lobbyImg,
    category: 'general',
    title: 'Patient Waiting Lounge',
    description: 'Spacious, air-conditioned waiting room designed to provide patient comfort during check-ins.'
  },
  {
    src: treatmentImg,
    category: 'general',
    title: 'Advanced Aesthetic Laser Suite',
    description: 'Fully equipped clinical room for FDA-approved laser treatments, PRP, and peel therapies.'
  },
  {
    src: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=800&q=80',
    category: 'general',
    title: 'Private Consultation Room',
    description: 'Dedicated chamber where Dr. G. Srinivasan conducts private skin, scalp, and hair examinations.'
  }
];

export default function Facilities() {
  const [activeTab, setActiveTab] = useState('all');
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const filteredImages = activeTab === 'all' 
    ? IMAGES 
    : IMAGES.filter(img => img.category === activeTab);

  // Handle keyboard events for lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, filteredImages]);

  const handleNext = () => {
    setLightboxIndex((prev) => (prev === null ? null : (prev + 1) % filteredImages.length));
  };

  const handlePrev = () => {
    setLightboxIndex((prev) => (prev === null ? null : (prev - 1 + filteredImages.length) % filteredImages.length));
  };

  return (
    <section id="facilities" className="py-24 px-6 relative overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-xs font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-widest bg-teal-500/10 border border-teal-500/20 px-3.5 py-1.5 rounded-full inline-block mb-3">
            Clinic Tour
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
            Our Setup & Facilities
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium text-sm sm:text-base leading-relaxed">
            Take a look inside our clean, modern clinical spaces and view our official premises and details. Click on any image to open the high-resolution lightbox viewer.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-12 border-b border-slate-100 dark:border-slate-900 pb-6">
          {CATEGORIES.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setLightboxIndex(null);
              }}
              className={`relative px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabGlow"
                  className="absolute inset-0 bg-teal-600 rounded-xl -z-10 shadow-md shadow-teal-600/15"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Facilities Grid */}
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredImages.map((img, index) => (
              <motion.div
                layout
                key={img.src}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="group rounded-3xl overflow-hidden bg-slate-50 dark:bg-slate-900/30 border border-slate-200/40 dark:border-slate-800/40 flex flex-col justify-between h-full shadow-sm hover:shadow-md transition-shadow cursor-pointer animate-fade-in"
                onClick={() => setLightboxIndex(index)}
              >
                <div className="relative overflow-hidden aspect-video sm:aspect-[4/3] bg-slate-100 dark:bg-slate-900 shrink-0">
                  <img
                    src={img.src}
                    alt={img.title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center border border-white/30 transform scale-90 group-hover:scale-100 transition-transform duration-300">
                      <Maximize2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 to-transparent pointer-events-none" />
                </div>
                {img.category !== 'general' && (
                  <div className="p-6 flex flex-col justify-between flex-grow">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2 leading-tight">
                        {img.title}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold mt-1">
                      {img.description}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Lightbox Modal */}
        <AnimatePresence>
          {lightboxIndex !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6"
              onClick={() => setLightboxIndex(null)}
            >
              {/* Close Button */}
              <button
                className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-colors cursor-pointer"
                onClick={() => setLightboxIndex(null)}
                aria-label="Close viewer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Navigation Arrows */}
              <button
                className="absolute left-4 sm:left-8 p-3.5 rounded-full bg-white/5 hover:bg-white/15 text-white border border-white/5 transition-colors cursor-pointer hidden sm:block"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                className="absolute right-4 sm:right-8 p-3.5 rounded-full bg-white/5 hover:bg-white/15 text-white border border-white/5 transition-colors cursor-pointer hidden sm:block"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                aria-label="Next photo"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              {/* Main Content Area */}
              <div 
                className="max-w-4xl w-full flex flex-col items-center"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Image */}
                <motion.div
                  initial={{ scale: 0.95, y: 10 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 10 }}
                  transition={{ duration: 0.3 }}
                  className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/5 bg-slate-900 max-h-[65vh] flex items-center justify-center"
                >
                  <img
                    src={filteredImages[lightboxIndex].src}
                    alt={filteredImages[lightboxIndex].title}
                    className="max-w-full max-h-[65vh] object-contain"
                  />
                </motion.div>

                {/* Meta details */}
                <div className="mt-6 text-center text-white max-w-xl px-4">
                  {filteredImages[lightboxIndex].category !== 'general' && (
                    <>
                      <h3 className="text-xl sm:text-2xl font-extrabold mb-2 tracking-tight">
                        {filteredImages[lightboxIndex].title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                        {filteredImages[lightboxIndex].description}
                      </p>
                    </>
                  )}
                  
                  {/* Photo counter / Swipe instruction for mobile */}
                  <div className="mt-4 flex items-center justify-center gap-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    <span>Photo {lightboxIndex + 1} of {filteredImages.length}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:inline">Use Arrow keys to navigate</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}
