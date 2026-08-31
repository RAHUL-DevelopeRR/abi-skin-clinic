import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import acneImage from '../assets/treatments/acne.jpg';
import alopeciaImage from '../assets/treatments/alopecia.jpg';
import cryotherapyImage from '../assets/treatments/cryotherapy.jpg';
import laserImage from '../assets/treatments/laser-hair-removal.jpg';
import nailFungusImage from '../assets/treatments/nail-fungus.jpg';
import psoriasisImage from '../assets/treatments/psoriasis.jpg';
import urticariaImage from '../assets/treatments/urticaria.jpg';
import vitiligoImage from '../assets/treatments/vitiligo.jpg';

const SERVICES = [
  {
    id: 'unwanted-hair',
    category: 'Laser & IPL',
    title: 'Unwanted Hair Removal',
    description: 'Doctor-supervised laser and IPL options selected for the treatment area and individual skin type.',
    image: laserImage,
    imageAlt: 'Clinician performing laser hair removal',
    highlights: ['Unwanted hair removal', 'IPL laser', 'Skin glow treatments'],
  },
  {
    id: 'pigmentation-laser',
    category: 'Laser & IPL',
    title: 'Pigmentation & Acne Scar Lasers',
    description: 'A tailored treatment plan for pigmentation and acne scarring, with laser suitability assessed in consultation.',
    image: acneImage,
    imageAlt: 'Clinical illustration showing acne formation in the skin',
    highlights: ['Acne pigmentation', 'Acne scars', 'Pigmentation lasers'],
  },
  {
    id: 'facial-warts-tattoo',
    category: 'Laser & IPL',
    title: 'Facial Warts & Tattoo Removal',
    description: 'Laser procedures for suitable facial warts and tattoos after diagnosis and treatment-area assessment.',
    image: laserImage,
    imageAlt: 'Clinician using a medical laser treatment device',
    highlights: ['Facial wart laser', 'Laser tattoo removal', 'Doctor assessment first'],
  },
  {
    id: 'cryotherapy',
    category: 'Medical',
    title: 'Liquid Nitrogen Cryotherapy',
    description: 'Targeted freezing treatment for suitable skin lesions, including selected warts, following examination.',
    image: cryotherapyImage,
    imageAlt: 'Liquid nitrogen cryotherapy being applied to a wart',
    highlights: ['Liquid nitrogen', 'Wart treatment', 'In-clinic procedure'],
  },
  {
    id: 'acne',
    category: 'Medical',
    title: 'Acne, Pigmentation & Scars',
    description: 'Medical care for active acne, post-acne pigmentation and acne scars based on severity and skin type.',
    image: acneImage,
    imageAlt: 'Clinical illustration showing acne formation in the skin',
    highlights: ['Active acne', 'Acne pigmentation', 'Acne scar care'],
  },
  {
    id: 'psoriasis-eczema',
    category: 'Medical',
    title: 'Psoriasis & Eczema',
    description: 'Diagnosis, flare management and longer-term care plans for inflammatory skin conditions.',
    image: psoriasisImage,
    imageAlt: 'Clinical reference photograph of psoriasis',
    highlights: ['Psoriasis', 'Eczema', 'Itch and flare management'],
  },
  {
    id: 'vitiligo',
    category: 'Medical',
    title: 'Vitiligo Care',
    description: 'Clinical evaluation and treatment planning for vitiligo, with progress reviewed over time.',
    image: vitiligoImage,
    imageAlt: 'Clinical reference photograph of vitiligo',
    highlights: ['Vitiligo assessment', 'Treatment planning', 'Follow-up care'],
  },
  {
    id: 'urticaria-lichen-planus',
    category: 'Medical',
    title: 'Urticaria & Lichen Planus',
    description: 'Evaluation of recurrent hives, triggers and inflammatory rashes, including lichen planus.',
    image: urticariaImage,
    imageAlt: 'Clinical reference photograph of urticaria or hives',
    highlights: ['Urticaria', 'Lichen planus', 'Trigger evaluation'],
  },
  {
    id: 'fungal-nail',
    category: 'Medical',
    title: 'Fungal & Nail Diseases',
    description: 'Diagnosis and treatment of fungal skin infections and nail disorders after clinical examination.',
    image: nailFungusImage,
    imageAlt: 'Clinical reference photograph of fungal nail disease',
    highlights: ['Ringworm', 'Nail fungus', 'Nail diseases'],
  },
  {
    id: 'hair-loss-alopecia',
    category: 'Hair',
    title: 'Hair Loss & Alopecia',
    description: 'Doctor-led evaluation of hair loss and alopecia with treatment based on the identified cause.',
    image: alopeciaImage,
    imageAlt: 'Clinical reference photograph of alopecia areata',
    highlights: ['Hair loss', 'Alopecia', 'Scalp evaluation'],
  },
];

const CATEGORIES = ['All', 'Laser & IPL', 'Medical', 'Hair'];

export default function Services() {
  const [activeCategory, setActiveCategory] = useState('All');
  const visibleServices = activeCategory === 'All'
    ? SERVICES
    : SERVICES.filter((service) => service.category === activeCategory);

  return (
    <section id="services" className="relative bg-slate-50 px-6 py-24 dark:bg-slate-900/40">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <span className="mb-4 inline-flex rounded-full bg-teal-500/10 px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-teal-700 dark:text-teal-300">
            Doctor-led dermatology, laser & IPL care
          </span>
          <h2 className="mb-5 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-5xl dark:text-white">
            Treatments available at ABI Clinic
          </h2>
          <p className="font-medium leading-relaxed text-slate-600 dark:text-slate-300">
            Every procedure starts with a clinical assessment. The doctor will confirm the diagnosis, treatment suitability and expected course before proceeding.
          </p>
        </div>

        <div className="mb-12 flex flex-wrap justify-center gap-2" aria-label="Filter treatments">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              aria-pressed={activeCategory === category}
              className={`rounded-full border px-5 py-2.5 text-sm font-bold transition-colors ${
                activeCategory === category
                  ? 'border-teal-600 bg-teal-600 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
              }`}
            >
              {category === 'All' ? 'All Treatments' : category}
            </button>
          ))}
        </div>

        <motion.div layout className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {visibleServices.map((service) => (
              <motion.article
                key={service.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.25 }}
                className="group overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm transition-shadow hover:shadow-xl hover:shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="relative h-52 overflow-hidden bg-slate-100 dark:bg-slate-900">
                  <img
                    src={service.image}
                    alt={service.imageAlt}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent px-5 pb-4 pt-10">
                    <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-white backdrop-blur-sm">
                      {service.category}
                    </span>
                  </div>
                </div>

                <div className="p-7">
                  <h3 className="mb-3 text-xl font-extrabold text-slate-950 dark:text-white">{service.title}</h3>
                  <p className="mb-5 text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-400">{service.description}</p>
                  <ul className="space-y-2 border-t border-slate-100 pt-5 dark:border-slate-800">
                    {service.highlights.map((highlight) => (
                      <li key={highlight} className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-500" aria-hidden="true" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>

        <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-teal-200/70 bg-teal-50 px-6 py-5 text-center text-sm font-semibold leading-relaxed text-teal-950 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-100">
          Clinical images are educational references, not before-and-after results. Treatment availability and suitability are confirmed by Dr. G. Srinivasan during consultation.{' '}
          <a href="/image-credits.html" className="underline decoration-teal-400 underline-offset-4 hover:text-teal-700 dark:hover:text-teal-300">Image credits</a>
        </div>
      </div>
    </section>
  );
}
