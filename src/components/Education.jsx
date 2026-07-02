import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Video, 
  Play, 
  X, 
  Info, 
  ShieldCheck, 
  User, 
  Clock, 
  Sparkles, 
  AlertCircle,
  HelpCircle,
  Activity,
  ArrowRight
} from 'lucide-react';
import SpotlightCard from './SpotlightCard';

// Asset imports
import patientConsultationImg from '../assets/patient_consultation.png';
import lobbyImg from '../assets/clinic_lobby.png';
import clinicAdImg from '../assets/clinic_ad.png';
import exteriorImg from '../assets/clinic_exterior.png';
import treatmentRoomImg from '../assets/clinic_treatment_room.png';

const CONDITIONS_DATA = [
  {
    id: 'cond-acne',
    name: 'Acne & Blackheads',
    overview: 'Acne vulgaris occurs when sebum (oil) and dead skin cells clog hair follicles, leading to bacterial growth and inflammatory breakouts.',
    symptoms: [
      'Whiteheads (closed clogged pores)',
      'Blackheads (open clogged pores)',
      'Papules (small red, tender bumps)',
      'Pustules (pimples with pus at the tips)',
      'Nodules or cystic lesions (painful lumps beneath the skin)'
    ],
    prevention: [
      'Wash your face twice daily with a gentle, non-comedogenic cleanser.',
      'Avoid touching, popping, or squeezing pimples to prevent scarring and infection.',
      'Use water-based, oil-free cosmetics and hair products.',
      'Keep hair clean and off your face, as oils can clog facial pores.',
      'Protect your skin with a lightweight, matte gel sunscreen.'
    ],
    doctorAdvice: 'Early intervention is crucial. Treating active acne early protects the skin from developing permanent ice-pick or rolling scars which require extensive resurfacing treatments later.',
    badge: 'Common Condition'
  },
  {
    id: 'cond-pigment',
    name: 'Melasma & Pigmentation',
    overview: 'Melasma causes flat, brown or gray-brown patches of discoloration, typically on the face (cheeks, forehead, upper lip) due to UV rays and hormonal shifts.',
    symptoms: [
      'Symmetric brownish patches on the face',
      'Hyperpigmentation after skin injuries or acne (PIH)',
      'Dull, uneven skin tone that worsens with sun exposure',
      'Freckles or sunspots that darken during summer'
    ],
    prevention: [
      'Apply a broad-spectrum sunscreen (SPF 50+) daily, even on cloudy days or when indoors.',
      'Reapply sunscreen every 3 to 4 hours if outdoors.',
      'Wear wide-brimmed hats and sunglasses under direct sunlight.',
      'Avoid harsh facial scrubs and products that sting or burn, as irritation triggers pigment cells.',
      'Incorporate skin-brightening agents like Vitamin C under clinical guidance.'
    ],
    doctorAdvice: 'Sun protection is non-negotiable. Without strict sunscreen discipline, melasma treatments will fail. Always look for sunscreens that protect against both UVA/UVB and visible blue light.',
    badge: 'Sun-Sensitive'
  },
  {
    id: 'cond-hair',
    name: 'Hair Thinning & Alopecia',
    overview: 'Hair loss occurs due to genetic sensitivity, DHT hormone activity on follicles, nutritional deficiencies, chronic stress, or scalp inflammation.',
    symptoms: [
      'Gradual hair thinning on the top or crown of the head',
      'Receding hairline forming an "M" shape (in men)',
      'Widening of the middle hair parting line (in women)',
      'Patchy, smooth round bald spots (Alopecia Areata)',
      'Excessive hair shedding during showers or combing'
    ],
    prevention: [
      'Maintain a protein-rich, balanced diet with iron, zinc, and biotin.',
      'Avoid tight hairstyles like high ponytails or braids that pull on hair roots.',
      'Minimize heat styling, chemical straighteners, and bleaching agents.',
      'Use a mild, sulfate-free shampoo to cleanse the scalp gently.',
      'Massage your scalp gently to stimulate micro-circulation.'
    ],
    doctorAdvice: 'Follicles shrink gradually before they stop producing hair completely. Seeking trichology consultation at the first sign of thinning allows us to rescue dormant follicles using PRP and medical therapy.',
    badge: 'High Success Rate'
  },
  {
    id: 'cond-eczema',
    name: 'Eczema / Dermatitis',
    overview: 'Eczema is a chronic skin condition characterized by a compromised skin barrier, leading to moisture loss, irritation, and hyper-reactivity to allergens.',
    symptoms: [
      'Dry, extremely sensitive skin',
      'Intense, persistent itching (often worse at night)',
      'Red, inflamed, or brownish-gray patches on hands, feet, ankles, or elbows',
      'Small, raised bumps that may leak fluid and crust over when scratched'
    ],
    prevention: [
      'Moisturize your skin at least twice daily with a thick, fragrance-free ceramide cream.',
      'Limit baths or showers to 10 minutes using lukewarm water instead of hot.',
      'Use gentle, soap-free cleansers that preserve the skin\'s natural oils.',
      'Pat dry gently with a towel rather than rubbing.',
      'Wear soft, breathable fabrics like cotton; avoid scratchy wool or synthetics.'
    ],
    doctorAdvice: 'The rule of thumb for eczema is barrier repair. Apply moisturizer within three minutes of bathing while the skin is damp. Never scratch the skin, as it breaks the barrier and invites secondary infections.',
    badge: 'Barrier Health'
  },
  {
    id: 'cond-psoriasis',
    name: 'Psoriasis Plaques',
    overview: 'Psoriasis is an autoimmune condition where skin cells multiply rapidly, stacking up on the surface to form red plaques covered with silvery scales.',
    symptoms: [
      'Red patches of skin covered with thick, silvery scales',
      'Dry, cracked skin that may itch, sting, or bleed',
      'Thickened, pitted, or ridged fingernails',
      'Swollen, stiff, and painful joints (psoriatic arthritis)'
    ],
    prevention: [
      'Keep skin hydrated using heavy ointment-based moisturizers.',
      'Protect your skin from cuts, scrapes, and insect bites (which can trigger new plaques).',
      'Avoid cold, dry weather trigger environments when possible.',
      'Manage stress, which is a major trigger for psoriasis flare-ups.',
      'Avoid alcohol consumption and smoking, which exacerbate symptoms.'
    ],
    doctorAdvice: 'Psoriasis is a chronic systemic condition, not just a cosmetic issue. Modern topical agents, targeted phototherapy, and systemic medications can safely keep plaques in remission and improve quality of life.',
    badge: 'Clinical Care Required'
  },
  {
    id: 'cond-fungal',
    name: 'Fungal Infections (Tinea)',
    overview: 'Fungal skin infections like ringworm or athlete\'s foot are caused by dermatophytes that feed on keratin in warm, humid skin folds.',
    symptoms: [
      'Circular, red, itchy rash with raised or scaly edges (ringworm)',
      'Peeling, cracking, or flaking skin between the toes',
      'Jock itch (itchy, red rash in the groin or inner thighs)',
      'Discolored, thickened, or crumbling nails (onychomycosis)'
    ],
    prevention: [
      'Keep skin clean and dry, especially in body folds (underarms, groin).',
      'Change socks, underwear, and sweaty gym clothes daily.',
      'Do not share towels, combs, hairbrushes, or shoes with others.',
      'Wear loose-fitting, breathable cotton clothing.',
      'Always wear sandals or shoes in public showers and gym locker rooms.'
    ],
    doctorAdvice: 'Many patients stop applying antifungal creams as soon as the itching stops. You must continue treatment for 1-2 weeks after the rash clears to ensure the fungal spores are fully eradicated and prevent recurrence.',
    badge: 'Highly Contagious'
  }
];

const VIDEOS_DATA = {
  educational: [
    {
      id: 'vid-acne-causes',
      title: 'Understanding Acne & Its Medical Causes',
      duration: '3:45',
      thumbnail: lobbyImg,
      description: 'Dr. Srinivasan explains the roles of sebum hyper-secretion, pore clogging, and bacterial growth in creating different types of acne.',
      clinicalNote: 'Understanding whether your acne is hormonal, comedonal, or inflammatory is the first step in designing an effective treatment plan.',
      category: 'Education'
    },
    {
      id: 'vid-skincare-routine',
      title: 'The Perfect Daily Skincare Routine',
      duration: '4:20',
      thumbnail: patientConsultationImg,
      description: 'A clinical guide to cleansing, moisturizing, and protecting your skin correctly according to dry, oily, or sensitive skin types.',
      clinicalNote: 'Skincare does not need to be expensive or complicated. A simple, consistent 3-step routine yields the best clinical outcomes.',
      category: 'Education'
    },
    {
      id: 'vid-sunscreen-guide',
      title: 'Sunscreen Science: Why & How to Apply',
      duration: '5:10',
      thumbnail: clinicAdImg,
      description: 'Learn how ultraviolet (UV) radiation triggers melanin production and skin aging, and the clinical way to apply and reapply SPF.',
      clinicalNote: 'Always use the two-finger rule to apply sunscreen. Apply it 20 minutes before stepping out and reapply every 3-4 hours.',
      category: 'Education'
    },
    {
      id: 'vid-hairloss-myths',
      title: 'Hair Loss: Separating Myths from Science',
      duration: '3:15',
      thumbnail: exteriorImg,
      description: 'Demystifying common scalp myths, hair oiling misconceptions, and reviewing the clinical efficacy of modern hair restoration therapies.',
      clinicalNote: 'Hair oils condition the hair shaft but cannot stop genetic hair loss. Target the hair roots with clinical serums and therapies.',
      category: 'Education'
    }
  ],
  procedures: [
    {
      id: 'vid-laser-toning',
      title: 'Q-Switched Nd:YAG Laser Toning',
      duration: '2:30',
      thumbnail: treatmentRoomImg,
      description: 'A walk-through of our US-FDA approved laser toning procedure. See how it breaks deep melanin to brighten tone and tighten pores.',
      clinicalNote: 'This treatment is safe for all skin types, causes no pain, and has zero downtime. Excellent for tan removal and melasma management.',
      category: 'Procedure'
    },
    {
      id: 'vid-hydrafacial',
      title: 'Medical HydraFacial & Infusion',
      duration: '1:50',
      thumbnail: treatmentRoomImg,
      description: 'Step-by-step demonstration of vortex cleaning, chemical exfoliation, blackhead extraction, and deep antioxidant serum infusion.',
      clinicalNote: 'A medical-grade facial that removes deep-seated impurities and replaces them with intense hydration for an instant radiant glow.',
      category: 'Procedure'
    },
    {
      id: 'vid-prp-therapy',
      title: 'PRP Hair Therapy Demonstration',
      duration: '3:00',
      thumbnail: patientConsultationImg,
      description: 'Learn how Platelet-Rich Plasma is extracted and administered to the scalp to release growth factors and revive thinning follicles.',
      clinicalNote: 'We use premium double-spin tube protocols to ensure a high concentration of active platelets for optimal hair density improvement.',
      category: 'Procedure'
    },
    {
      id: 'vid-chemical-peels',
      title: 'Chemical Peeling for Skin Renewal',
      duration: '2:10',
      thumbnail: treatmentRoomImg,
      description: 'See the application process of gentle, clinical salicylic and glycolic acid peels to treat active acne, clear scars, and reduce spots.',
      clinicalNote: 'Chemical peels are tailored to your skin tolerance. Post-procedure sun protection is critical as new skin forms.',
      category: 'Procedure'
    }
  ]
};

export default function Education() {
  const [activeTab, setActiveTab] = useState('conditions'); // 'conditions' | 'education-vids' | 'procedure-vids'
  const [selectedCondition, setSelectedCondition] = useState(CONDITIONS_DATA[0]);
  const [playingVideo, setPlayingVideo] = useState(null);

  // Helper for rendering simulated playback screen
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(35);

  const startVideo = (video) => {
    setPlayingVideo(video);
    setIsPlaying(true);
    setProgress(Math.floor(Math.random() * 40) + 15);
  };

  const closeVideo = () => {
    setPlayingVideo(null);
    setIsPlaying(false);
  };

  return (
    <section id="education" className="py-24 px-6 bg-slate-50 dark:bg-slate-900/40 relative overflow-hidden">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal-500/5 dark:bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-12 left-1/4 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-sm font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-widest block mb-3">
            Patient Resources
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white mb-4">
            Education & Care Hub
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium text-sm sm:text-base leading-relaxed">
            Dr. Srinivasan believes that healthy skin begins with awareness. Explore detailed skin guides, daily care videos, and clinical walkthroughs designed for our patients at Karur.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex justify-center mb-12">
          <div className="flex p-1.5 rounded-2xl bg-slate-200/60 dark:bg-slate-950 border border-slate-300/20 dark:border-slate-800/50 glass max-w-full overflow-x-auto gap-1">
            <button
              onClick={() => setActiveTab('conditions')}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'conditions'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/10'
                  : 'text-slate-600 dark:text-slate-455 hover:text-teal-600 dark:hover:text-teal-400'
              }`}
            >
              <BookOpen className="w-4.5 h-4.5" />
              <span>Skin Conditions</span>
            </button>
            
            <button
              onClick={() => setActiveTab('education-vids')}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'education-vids'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/10'
                  : 'text-slate-600 dark:text-slate-455 hover:text-teal-600 dark:hover:text-teal-400'
              }`}
            >
              <Video className="w-4.5 h-4.5" />
              <span>Skincare Videos</span>
            </button>

            <button
              onClick={() => setActiveTab('procedure-vids')}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'procedure-vids'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/10'
                  : 'text-slate-600 dark:text-slate-455 hover:text-teal-600 dark:hover:text-teal-400'
              }`}
            >
              <Play className="w-4.5 h-4.5 shrink-0" />
              <span>Procedure Walkthroughs</span>
            </button>
          </div>
        </div>

        {/* Tab Content Panels */}
        <AnimatePresence mode="wait">
          {activeTab === 'conditions' && (
            <motion.div
              key="conditions"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start"
            >
              {/* Left Column: Condition List */}
              <div className="md:col-span-4 space-y-3">
                <span className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2 mb-2">Select a Condition:</span>
                <div className="space-y-2">
                  {CONDITIONS_DATA.map((cond) => (
                    <button
                      key={cond.id}
                      onClick={() => setSelectedCondition(cond)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex justify-between items-center group cursor-pointer ${
                        selectedCondition.id === cond.id
                          ? 'bg-teal-600/5 dark:bg-teal-950/20 border-teal-600 dark:border-teal-500 text-slate-900 dark:text-white font-bold'
                          : 'bg-white dark:bg-slate-950 border-slate-200/50 dark:border-slate-800/80 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold">{cond.name}</span>
                        <span className="text-[10px] opacity-75 font-semibold">{cond.badge}</span>
                      </div>
                      <ArrowRight className={`w-4 h-4 text-teal-600 dark:text-teal-400 transition-transform ${
                        selectedCondition.id === cond.id ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5'
                      }`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Column: Detailed View */}
              <div className="md:col-span-8">
                <SpotlightCard className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-900">
                    <div>
                      <span className="inline-block text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider bg-teal-50 dark:bg-teal-950/40 border border-teal-200/20 px-3 py-1 rounded-full mb-3">
                        {selectedCondition.badge}
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                        {selectedCondition.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-450 font-semibold bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200/30 dark:border-slate-850">
                      <Info className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      <span>Clinical Reference</span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Overview */}
                    <div className="space-y-2">
                      <h4 className="text-xs uppercase tracking-wider font-extrabold text-slate-400">Clinical Overview</h4>
                      <p className="text-sm sm:text-base text-slate-650 dark:text-slate-300 font-medium leading-relaxed">
                        {selectedCondition.overview}
                      </p>
                    </div>

                    {/* Grid of Symptoms and Prevention */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Symptoms */}
                      <div className="space-y-3 p-5 rounded-2xl bg-rose-500/5 dark:bg-rose-500/5 border border-rose-200/10">
                        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                          <AlertCircle className="w-5 h-5 shrink-0" />
                          <h5 className="font-extrabold text-xs uppercase tracking-wider">Common Symptoms</h5>
                        </div>
                        <ul className="space-y-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-350">
                          {selectedCondition.symptoms.map((sym, idx) => (
                            <li key={idx} className="flex gap-2 items-start">
                              <span className="w-1.5 h-1.5 bg-rose-500 dark:bg-rose-400 rounded-full mt-1.5 shrink-0" />
                              <span>{sym}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Prevention */}
                      <div className="space-y-3 p-5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/5 border border-emerald-200/10">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                          <ShieldCheck className="w-5 h-5 shrink-0" />
                          <h5 className="font-extrabold text-xs uppercase tracking-wider">Prevention & Care</h5>
                        </div>
                        <ul className="space-y-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-350">
                          {selectedCondition.prevention.map((prev, idx) => (
                            <li key={idx} className="flex gap-2 items-start">
                              <span className="w-1.5 h-1.5 bg-emerald-500 dark:bg-emerald-400 rounded-full mt-1.5 shrink-0" />
                              <span>{prev}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Doctor's Quote Box */}
                    <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 relative overflow-hidden flex gap-4">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-teal-600/5 rounded-full blur-xl pointer-events-none" />
                      <div className="p-3 bg-teal-50 dark:bg-teal-950/40 rounded-2xl h-fit shrink-0 text-teal-600 dark:text-teal-400">
                        <User className="w-6 h-6" />
                      </div>
                      <div className="space-y-1.5">
                        <span className="block text-[10px] font-extrabold uppercase tracking-widest text-teal-600 dark:text-teal-400">Dr. Srinivasan\'s Advice</span>
                        <blockquote className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-bold italic leading-relaxed">
                          "{selectedCondition.doctorAdvice}"
                        </blockquote>
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Abi Skin Clinic, Karur</span>
                      </div>
                    </div>
                  </div>
                </SpotlightCard>
              </div>
            </motion.div>
          )}

          {activeTab === 'education-vids' && (
            <motion.div
              key="education-vids"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {VIDEOS_DATA.educational.map((vid) => (
                <SpotlightCard 
                  key={vid.id}
                  className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-sm flex flex-col h-full group"
                >
                  {/* Thumbnail Video Panel */}
                  <div className="relative aspect-video overflow-hidden bg-slate-900 flex items-center justify-center shrink-0">
                    <img 
                      src={vid.thumbnail} 
                      alt={vid.title} 
                      className="w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-slate-950/45 group-hover:bg-slate-950/30 transition-colors" />
                    
                    {/* Floating Play Button */}
                    <button 
                      onClick={() => startVideo(vid)}
                      className="w-12 h-12 bg-white/95 text-teal-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform cursor-pointer relative z-10 hover:bg-white"
                      title="Play Video"
                    >
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </button>

                    {/* Floating Duration badge */}
                    <span className="absolute bottom-3 right-3 bg-slate-950/80 text-[10px] text-white px-2.5 py-1 rounded-lg font-bold tracking-wider flex items-center gap-1 border border-white/5">
                      <Clock className="w-3 h-3" />
                      <span>{vid.duration}</span>
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-grow flex flex-col justify-between">
                    <div className="space-y-2">
                      <span className="inline-block text-[9px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest bg-teal-50 dark:bg-teal-950/40 border border-teal-200/20 px-2 py-0.5 rounded-md">
                        {vid.category}
                      </span>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        {vid.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                        {vid.description}
                      </p>
                    </div>

                    <button 
                      onClick={() => startVideo(vid)}
                      className="mt-5 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer"
                    >
                      <span>Watch & Read Tips</span>
                      <Play className="w-3 h-3 fill-current ml-0.5" />
                    </button>
                  </div>
                </SpotlightCard>
              ))}
            </motion.div>
          )}

          {activeTab === 'procedure-vids' && (
            <motion.div
              key="procedure-vids"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {VIDEOS_DATA.procedures.map((vid) => (
                <SpotlightCard 
                  key={vid.id}
                  className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-sm flex flex-col h-full group"
                >
                  {/* Thumbnail Video Panel */}
                  <div className="relative aspect-video overflow-hidden bg-slate-900 flex items-center justify-center shrink-0">
                    <img 
                      src={vid.thumbnail} 
                      alt={vid.title} 
                      className="w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-slate-950/45 group-hover:bg-slate-950/30 transition-colors" />
                    
                    {/* Floating Play Button */}
                    <button 
                      onClick={() => startVideo(vid)}
                      className="w-12 h-12 bg-white/95 text-teal-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform cursor-pointer relative z-10 hover:bg-white"
                      title="Play Video"
                    >
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </button>

                    {/* Floating Duration badge */}
                    <span className="absolute bottom-3 right-3 bg-slate-950/80 text-[10px] text-white px-2.5 py-1 rounded-lg font-bold tracking-wider flex items-center gap-1 border border-white/5">
                      <Clock className="w-3 h-3" />
                      <span>{vid.duration}</span>
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-grow flex flex-col justify-between">
                    <div className="space-y-2">
                      <span className="inline-block text-[9px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest bg-teal-50 dark:bg-teal-950/40 border border-teal-200/20 px-2 py-0.5 rounded-md">
                        {vid.category}
                      </span>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        {vid.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                        {vid.description}
                      </p>
                    </div>

                    <button 
                      onClick={() => startVideo(vid)}
                      className="mt-5 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer"
                    >
                      <span>Watch Walkthrough</span>
                      <Play className="w-3 h-3 fill-current ml-0.5" />
                    </button>
                  </div>
                </SpotlightCard>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Video Player Modal Lightbox overlay */}
        <AnimatePresence>
          {playingVideo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-950/80 backdrop-filter backdrop-blur-md flex items-center justify-center p-4"
              role="dialog"
              aria-modal="true"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="w-full max-w-4xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
              >
                {/* Left Column: Simulated Video Screen */}
                <div className="w-full md:w-3/5 aspect-video md:aspect-auto bg-slate-900 relative flex items-center justify-center overflow-hidden flex-col group min-h-[250px] md:min-h-[450px]">
                  <img 
                    src={playingVideo.thumbnail} 
                    alt="Video backdrop" 
                    className="absolute inset-0 w-full h-full object-cover opacity-35 filter blur-xs"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                  
                  {/* Dynamic Playback UI overlay */}
                  <div className="relative z-10 text-center text-white px-6 space-y-4">
                    {/* Simulated pulse wave */}
                    <div className="flex justify-center gap-1.5 h-16 items-center">
                      <div className={`w-1 bg-teal-500 rounded-full transition-all duration-300 ${isPlaying ? 'animate-pulse h-12' : 'h-3'}`} />
                      <div className={`w-1 bg-teal-400 rounded-full transition-all duration-300 ${isPlaying ? 'animate-pulse h-8' : 'h-3'}`} />
                      <div className={`w-1 bg-teal-500 rounded-full transition-all duration-300 ${isPlaying ? 'animate-pulse h-14' : 'h-3'}`} style={{ animationDelay: '0.15s' }} />
                      <div className={`w-1 bg-teal-400 rounded-full transition-all duration-300 ${isPlaying ? 'animate-pulse h-9' : 'h-3'}`} style={{ animationDelay: '0.3s' }} />
                      <div className={`w-1 bg-teal-500 rounded-full transition-all duration-300 ${isPlaying ? 'animate-pulse h-5' : 'h-3'}`} style={{ animationDelay: '0.45s' }} />
                    </div>

                    <div className="flex flex-col items-center justify-center gap-3">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-400 bg-teal-950/60 border border-teal-500/20 px-3.5 py-1.5 rounded-full">
                        {isPlaying ? 'Now Simulating Playback' : 'Playback Paused'}
                      </span>
                      <h4 className="text-lg font-bold text-white leading-tight">
                        {playingVideo.title}
                      </h4>
                    </div>

                    {/* Controller bar */}
                    <div className="pt-8 w-64 mx-auto flex items-center justify-between gap-4">
                      <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="p-3.5 bg-white text-slate-950 hover:bg-teal-400 hover:text-white rounded-full transition-all cursor-pointer shadow-lg shadow-teal-500/10"
                      >
                        {isPlaying ? (
                          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                        ) : (
                          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        )}
                      </button>

                      <div className="flex-grow bg-white/20 h-1.5 rounded-full overflow-hidden relative">
                        <div 
                          className="bg-teal-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }} 
                        />
                      </div>
                      <span className="text-[10px] font-mono tracking-wide whitespace-nowrap text-slate-300">
                        {Math.floor((parseFloat(playingVideo.duration) * progress) / 100)}:{(Math.floor((parseFloat(playingVideo.duration) * progress * 60) / 100) % 60).toString().padStart(2, '0')} / {playingVideo.duration}
                      </span>
                    </div>
                  </div>

                  {/* Logo overlay on top left */}
                  <div className="absolute top-6 left-6 text-white/50 text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5 z-20">
                    <Sparkles className="w-3.5 h-3.5 text-teal-500" />
                    <span>ABI SKIN CLINIC VIDEO PORTAL</span>
                  </div>
                </div>

                {/* Right Column: Descriptions & Doctor's Tips */}
                <div className="w-full md:w-2/5 p-6 sm:p-8 flex flex-col justify-between relative bg-slate-50 dark:bg-slate-950">
                  {/* Close button top right */}
                  <button
                    onClick={closeVideo}
                    className="absolute top-4 right-4 p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer border border-slate-200/50 dark:border-slate-800"
                    aria-label="Close video player"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="space-y-6 pt-6">
                    {/* Info */}
                    <div className="space-y-2">
                      <span className="inline-block text-[9px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest bg-teal-50 dark:bg-teal-950/40 border border-teal-200/20 px-2 py-0.5 rounded-md">
                        {playingVideo.category} Video
                      </span>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                        {playingVideo.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
                        {playingVideo.description}
                      </p>
                    </div>

                    <div className="border-t border-slate-200/50 dark:border-slate-900 pt-6">
                      <div className="flex gap-3 items-start">
                        <div className="p-2.5 bg-teal-50 dark:bg-teal-950/50 rounded-xl text-teal-600 dark:text-teal-400 shrink-0">
                          <Activity className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <h4 className="text-xs uppercase tracking-wider font-extrabold text-slate-400 mb-1">Clinical Insight</h4>
                          <blockquote className="text-xs sm:text-sm font-semibold italic text-slate-700 dark:text-slate-300 leading-relaxed">
                            "{playingVideo.clinicalNote}"
                          </blockquote>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-slate-200/50 dark:border-slate-900 flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                    <span>Chief Editor: Dr. Srinivasan</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{playingVideo.duration} mins</span>
                    </span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}
