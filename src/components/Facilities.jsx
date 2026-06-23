import { motion } from 'framer-motion';
import lobbyImg from '../assets/clinic_lobby.png';
import treatmentImg from '../assets/clinic_treatment_room.png';
import exteriorImg from '../assets/clinic_exterior.png';

const IMAGES = [
  {
    src: exteriorImg,
    title: 'Velayuthampalayam Bypass Premises',
    description: 'Our newly relocated, spacious clinic building. Conveniently situated near Pugali Mandapam with easy bypass access and dedicated patient parking.'
  },
  {
    src: lobbyImg,
    title: 'Comfortable Patient Waiting Lounge',
    description: 'Designed to offer a calm, clean, and welcoming environment for patients and accompanying family members during consultation check-ins.'
  },
  {
    src: treatmentImg,
    title: 'Advanced Medical Aesthetic Suite',
    description: 'Equipped with US-FDA approved technologies, sterilized clinical layouts, and modern hydration systems for premium, safe aesthetic therapies.'
  }
];

export default function Facilities() {
  return (
    <section id="facilities" className="py-24 px-6 relative overflow-hidden bg-white dark:bg-slate-950">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-sm font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-widest block mb-3">Clinic Tour</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white mb-4">
            Our Setup & Facilities
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium">
            Take a look inside our clean, modern clinical spaces designed specifically for patient hygiene, comfort, and state-of-the-art dermatological procedures.
          </p>
        </div>

        {/* Facilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {IMAGES.map((img, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="group rounded-3xl overflow-hidden bg-slate-50 dark:bg-slate-900/40 border border-slate-200/40 dark:border-slate-800/40 flex flex-col justify-between h-full shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="relative overflow-hidden aspect-video sm:aspect-[4/3] bg-slate-100 dark:bg-slate-900 shrink-0">
                <img
                  src={img.src}
                  alt={img.title}
                  className="w-full h-full object-cover transform group-hover:scale-103 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 to-transparent pointer-events-none" />
              </div>
              <div className="p-6 flex flex-col justify-between flex-grow">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  {img.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                  {img.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
