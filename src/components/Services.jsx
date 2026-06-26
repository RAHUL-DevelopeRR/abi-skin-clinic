import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TiltedCard from './TiltedCard';
import SpotlightCard from './SpotlightCard';

const SERVICES_DATA = [
  // Skin Services
  {
    id: 'skin-1',
    category: 'Skin',
    title: 'Acne & Scar Revision',
    description: 'Advanced clinical treatments for active acne, cystic breakouts, and deep acne scars. Utilizes localized peels and micro-needling.',
    sessions: '3-6 Sessions',
    image: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=600&q=80',
    highlights: ['Comedone extraction', 'Salicylic peels', 'Scar resurfacing']
  },
  {
    id: 'skin-2',
    category: 'Skin',
    title: 'Eczema & Psoriasis Management',
    description: 'Specialized treatment plans for chronic skin conditions, providing quick relief from itching, inflammation, and scaling.',
    sessions: 'Ongoing support',
    image: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&w=600&q=80',
    highlights: ['Steroid-free alternatives', 'Biologics consulting', 'Dietary trigger guidance']
  },
  {
    id: 'skin-3',
    category: 'Skin',
    title: 'Wart, Mole & Tag Removal',
    description: 'Quick, safe, and virtually painless radiofrequency cauterization or laser removal of warts, moles, skin tags, and DPNs.',
    sessions: '1 Session (Instant)',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
    highlights: ['Scarless healing', 'Local anesthesia', 'Same-day biopsy check']
  },
  
  // Hair Services
  {
    id: 'hair-1',
    category: 'Hair',
    title: 'PRP Hair Rejuvenation',
    description: 'Platelet-Rich Plasma therapy using your own growth factors to stimulate dormant follicles, increase density, and stop hair thinning.',
    sessions: '4-8 Sessions',
    image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
    highlights: ['High-density spin tubes', 'Minimal downtime', 'Natural follicular growth']
  },
  {
    id: 'hair-2',
    category: 'Hair',
    title: 'Alopecia & Thinning Treatment',
    description: 'Comprehensive trichology analysis to combat alopecia areata and male/female pattern baldness with customized medical plans.',
    sessions: '3-12 Months Plan',
    image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=600&q=80',
    highlights: ['DHT blocker therapy', 'Laser comb stimulation', 'Nutritional guidance']
  },
  {
    id: 'hair-3',
    category: 'Hair',
    title: 'Anti-Dandruff & Scalp Detox',
    description: 'Medical scalp peeling and anti-fungal treatments to eliminate stubborn dandruff, seborrheic dermatitis, and scalp itching.',
    sessions: '2-4 Sessions',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
    highlights: ['Scalp scaling', 'Laser blue light therapy', 'PH balancing rinse']
  },

  // Aesthetic Services
  {
    id: 'aesthetic-1',
    category: 'Aesthetic',
    title: 'Hydrafacial & Skin Polishing',
    description: 'Multi-step skin resurfacing that cleanses, exfoliates, and extracts impurities while infusing vital antioxidants and hydration.',
    sessions: 'Monthly maintenance',
    image: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=600&q=80',
    highlights: ['Vortex suction cleaning', 'Hyaluronic acid infusion', 'Instant red-carpet glow']
  },
  {
    id: 'aesthetic-2',
    category: 'Aesthetic',
    title: 'Laser Hair Reduction',
    description: 'US-FDA approved diode laser technology for safe, permanent reduction of unwanted hair on face, underarms, or full body.',
    sessions: '6-8 Sessions',
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80',
    highlights: ['Cooling tip technology', 'Pain-free sessions', 'Safe for all Indian skin types']
  },
  {
    id: 'aesthetic-3',
    category: 'Aesthetic',
    title: 'Carbon Laser Peel & Toning',
    description: 'Also known as the "Hollywood Peel." Lasing action targets carbon particles to tighten pores, reduce pigmentation, and brighten tone.',
    sessions: '3-5 Sessions',
    image: 'https://images.unsplash.com/photo-1552693673-1bf958298935?auto=format&fit=crop&w=600&q=80',
    highlights: ['Deep pore tightening', 'Oil control', 'Immediate brightening']
  }
];

export default function Services() {
  const [activeTab, setActiveTab] = useState('Skin');
  const categories = ['Skin', 'Hair', 'Aesthetic', 'All'];

  const filteredServices = activeTab === 'All' 
    ? SERVICES_DATA 
    : SERVICES_DATA.filter(s => s.category === activeTab);

  return (
    <section id="services" className="py-24 px-6 bg-slate-50 dark:bg-slate-900/40 relative">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-sm font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-widest block mb-3">Our Clinical Focus</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white mb-4">
            Dermatology & Cosmetology
          </h2>
          <p className="text-slate-655 dark:text-slate-400 max-w-2xl mx-auto font-medium">
            We combine medical-grade clinical science with premium aesthetic technologies to deliver visible, long-term results for your skin and hair.
          </p>
        </div>

        {/* Categories Tab bar */}
        <div className="flex justify-center gap-2 mb-12 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`relative px-6 py-2.5 rounded-full text-sm font-bold transition-all cursor-pointer ${
                activeTab === cat
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/10'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-355 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/50 dark:border-slate-850'
              }`}
            >
              {cat === 'All' ? 'All Treatments' : `${cat} Care`}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <AnimatePresence mode="popLayout">
            {filteredServices.map((service, index) => {
              return (
                <motion.div
                  key={service.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="h-full"
                >
                  <TiltedCard tiltMaxAngleX={8} tiltMaxAngleY={8} className="h-full">
                    <SpotlightCard className="h-full rounded-3xl bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-850/80 shadow-sm hover:shadow-md transition-shadow p-8 flex flex-col justify-between">
                      <div>
                        {/* Header Info */}
                        <div className="flex justify-between items-center mb-6">
                          {/* Elegant typographic number replaces generic Lucide icons */}
                          <span className="text-3xl font-extrabold text-teal-200 dark:text-teal-900/65 font-serif italic tracking-tighter select-none">
                            0{index + 1}
                          </span>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200/20">
                            {service.sessions}
                          </span>
                        </div>

                        {/* Service Image Banner */}
                        <div className="w-full h-44 rounded-2xl overflow-hidden mb-6 bg-slate-100 dark:bg-slate-900 border border-slate-200/20 dark:border-slate-800/20 relative shadow-sm">
                          <img 
                            src={service.image} 
                            alt={service.title} 
                            className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500" 
                            loading="lazy"
                          />
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-3">
                          {service.title}
                        </h3>

                        {/* Description */}
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-6">
                          {service.description}
                        </p>
                      </div>

                      {/* Highlights */}
                      <div className="border-t border-slate-100 dark:border-slate-900 pt-5">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Key Inclusions:</span>
                        <ul className="space-y-2">
                          {service.highlights.map((h, i) => (
                            <li key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-650 dark:text-slate-350">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                              <span>{h}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </SpotlightCard>
                  </TiltedCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* Bottom Notice */}
        <div className="text-center mt-16 p-6 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/40 dark:border-slate-800/40 max-w-2xl mx-auto">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
            *All therapies are customized by Dr. Srinivasan G. following a deep clinical analysis of your skin type, medical history, and specific diagnostic goals.
          </span>
        </div>

      </div>
    </section>
  );
}
