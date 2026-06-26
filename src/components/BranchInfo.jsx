import { MapPin, Phone, Clock, Navigation } from 'lucide-react';
import SpotlightCard from './SpotlightCard';

const BRANCHES = [
  {
    name: 'Karur Clinic (Main Branch)',
    address: '10 West, North Madavalagam Road, Behind Easwaran Kovil, Madavilagam, Karur - 639001',
    phone: '+91 75981 26430',
    altPhone: '+91 94437 66998',
    timings: [
      { days: 'Monday - Saturday (Morning)', hours: '9:00 AM - 1:00 PM' },
      { days: 'Monday - Saturday (Evening)', hours: '4:00 PM - 8:30 PM' },
      { days: 'Sunday', hours: 'Closed' }
    ],
    mapLink: 'https://www.google.com/maps?cid=15656561799087123579',
    embedLink: 'https://maps.google.com/maps?q=Abi%20Skin%20and%20Hair%20Clinic,%20Madavilagam,%20Karur&t=&z=16&ie=UTF8&iwloc=&output=embed',
    tag: 'Dermatologist available in morning & evening'
  },
  {
    name: 'Velayuthampalayam Clinic',
    address: 'Valluvar Nagar, South 1st Street, Velayuthampalayam Bypass, Near Pugali Mandapam, Behind Pillaiyar Kovil (Raja Ganapathy), Velayuthampalayam - 639117',
    phone: '+91 75981 26430',
    altPhone: '+91 94437 66998',
    timings: [
      { days: 'Monday - Saturday (Evening)', hours: '5:30 PM - 8:30 PM' },
      { days: 'Sunday', hours: 'Closed' }
    ],
    mapLink: 'https://www.google.com/maps?cid=2613778443127105123',
    embedLink: 'https://maps.google.com/maps?q=Abi%20Skin%20and%20Hair%20Clinic,%20Velayuthampalayam%20Bypass&t=&z=16&ie=UTF8&iwloc=&output=embed',
    tag: 'Convenient evening consultations'
  }
];

export default function BranchInfo() {
  return (
    <section id="branches" className="py-24 px-6 bg-slate-50 dark:bg-slate-900/40 relative">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-sm font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-widest block mb-3">Our Locations</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white mb-4">
            Branches & Timings
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium">
            Find the branch closest to you. Book an appointment or walk in during consulting hours for professional skin and hair assessment.
          </p>
        </div>

        {/* Branch Cards list */}
        <div className="space-y-10">
          {BRANCHES.map((branch, index) => (
            <SpotlightCard 
              key={index}
              className="rounded-3xl bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/80 p-8 shadow-sm flex flex-col lg:flex-row gap-8 items-stretch"
            >
              {/* Details Column */}
              <div className="flex-grow flex flex-col justify-between lg:w-[55%]">
                <div>
                  {/* Branch Header */}
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {branch.name}
                      </h3>
                      <span className="inline-block text-[11px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider bg-teal-50 dark:bg-teal-950/40 border border-teal-200/20 px-3 py-1 rounded-full mt-2">
                        {branch.tag}
                      </span>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-3 mb-6">
                    <MapPin className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-1" />
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                      {branch.address}
                    </p>
                  </div>

                  {/* Phone */}
                  <div className="flex items-center gap-3 mb-6">
                    <Phone className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      <a href={`tel:${branch.phone.replace(/\s+/g, '')}`} className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                        {branch.phone}
                      </a>
                      <span className="text-slate-400 dark:text-slate-650 mx-2">/</span>
                      <a href={`tel:${branch.altPhone.replace(/\s+/g, '')}`} className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                        {branch.altPhone}
                      </a>
                    </div>
                  </div>

                  {/* Hours List */}
                  <div className="border-t border-slate-100 dark:border-slate-900 pt-6 mb-8">
                    <div className="flex items-center gap-2 mb-4">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Consultation Timings:</span>
                    </div>
                    <ul className="space-y-3">
                      {branch.timings.map((time, idx) => (
                        <li key={idx} className="flex justify-between items-center text-sm font-semibold text-slate-600 dark:text-slate-350">
                          <span>{time.days}</span>
                          <span className="text-slate-950 dark:text-white bg-slate-50 dark:bg-slate-900 px-3 py-1 rounded-lg text-xs border border-slate-200/30 dark:border-slate-800/30">
                            {time.hours}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-slate-900">
                  <a
                    href="#book"
                    className="flex-1 text-center bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl shadow-md shadow-teal-600/10 transition-colors text-sm"
                  >
                    Book Appointment
                  </a>
                  <a
                    href={branch.mapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-3.5 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center justify-center border border-slate-200/50 dark:border-slate-800"
                    title="Open in Google Maps"
                  >
                    <Navigation className="w-4.5 h-4.5" />
                  </a>
                </div>
              </div>

              {/* Map Column */}
              <div className="w-full lg:w-[45%] min-h-[300px] lg:min-h-auto rounded-2xl overflow-hidden border border-slate-200/50 dark:border-slate-800/50 shadow-inner shrink-0 bg-slate-100 dark:bg-slate-900 flex">
                <iframe
                  src={branch.embedLink}
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: '300px' }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`Map location for ${branch.name}`}
                  className="w-full h-full flex-grow"
                ></iframe>
              </div>
            </SpotlightCard>
          ))}
        </div>

      </div>
    </section>
  );
}
