import { Lock, Search } from 'lucide-react';
import ClinicLogo from './ClinicLogo';

export default function Footer({ onOpenLookup }) {
  return (
    <footer className="py-16 px-6 bg-slate-900 text-slate-400 border-t border-slate-800 relative z-10">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-12 mb-12">
          
          {/* Logo & Slogan */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <ClinicLogo className="w-10 h-12" />
              <div>
                <span className="block text-[10px] uppercase font-bold tracking-widest text-teal-400">
                  Dr. Srinivasan's
                </span>
                <span className="font-extrabold text-xl tracking-tight text-white">
                  ABI SKIN & HAIR
                </span>
                <span className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 -mt-1">
                  Care Clinic
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed font-medium">
              Doctor-led skin and hair care in Karur and Velayuthampalayam, with treatment selected after an individual clinical consultation.
            </p>
            <div className="pt-2 flex flex-wrap gap-2">
              <button
                onClick={onOpenLookup}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-teal-400" />
                Track Appointment
              </button>
              <a
                href="/admin"
                rel="nofollow"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-teal-500" />
                Doctor Portal
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h2 className="font-bold text-white text-xs uppercase tracking-wider mb-4">Quick Links</h2>
            <ul className="space-y-2.5 text-sm font-semibold">
              <li><a href="#home" className="hover:text-teal-400 transition-colors">Home</a></li>
              <li><a href="#services" className="hover:text-teal-400 transition-colors">Treatments</a></li>
              <li><a href="#about" className="hover:text-teal-400 transition-colors">The Doctor</a></li>
              <li><a href="#branches" className="hover:text-teal-400 transition-colors">Branches</a></li>
              <li><a href="#reviews" className="hover:text-teal-400 transition-colors">Patient Reviews</a></li>
              <li><a href="#book" className="hover:text-teal-400 transition-colors text-teal-400">Book Appointment</a></li>
              <li><a href="/privacy.html" className="hover:text-teal-400 transition-colors">Privacy Notice</a></li>
              <li><a href="/image-credits.html" className="hover:text-teal-400 transition-colors">Image Credits</a></li>
            </ul>
          </div>

          {/* Branch Contact Info */}
          <div>
            <h2 className="font-bold text-white text-xs uppercase tracking-wider mb-4">Support Channels</h2>
            <ul className="space-y-3 text-xs font-semibold">
              <li>
                <span className="block text-slate-400">Karur Clinic:</span>
                <a href="tel:+917598126430" className="text-slate-350 hover:text-white transition-colors">+91 75981 26430</a>
              </li>
              <li>
                <span className="block text-slate-400">Velayuthampalayam:</span>
                <a href="tel:+919443766998" className="text-slate-350 hover:text-white transition-colors">+91 94437 66998</a>
              </li>
              <li>
                <span className="block text-slate-400">Email Enquiries:</span>
                <a href="mailto:abiskinandhairclinic@gmail.com" className="text-slate-350 hover:text-white transition-colors">abiskinandhairclinic@gmail.com</a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <div>
            &copy; {new Date().getFullYear()} Dr. Srinivasan's Abi Skin & Hair Clinic. All rights reserved.
          </div>
          <div className="text-slate-400 font-medium text-center md:text-right max-w-md">
            Dr. Srinivasan's Abi Skin & Hair Care Clinic is dedicated to offering advanced clinical dermatology, trichology, and non-surgical aesthetic procedures.
          </div>
        </div>

      </div>
    </footer>
  );
}
