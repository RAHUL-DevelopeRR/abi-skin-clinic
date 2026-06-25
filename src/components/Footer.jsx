import { Sparkles, HeartPulse, ExternalLink } from 'lucide-react';
import ClinicLogo from './ClinicLogo';

export default function Footer() {
  return (
    <footer className="py-16 px-6 bg-slate-900 text-slate-400 border-t border-slate-850 relative z-10">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-12 mb-12">
          
          {/* Logo & Slogan */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <ClinicLogo className="w-10 h-12" />
              <div>
                <span className="font-extrabold text-xl tracking-tight text-white">
                  ABI SKIN & HAIR
                </span>
                <span className="block text-[10px] uppercase font-bold tracking-widest text-teal-400 -mt-1">
                  Care Clinic
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed font-medium">
              Top 1% clinical skin and hair wellness services in Karur and Velayuthampalayam. Under the expert medical guidance of Dr. Srinivasan G. (16+ years experience).
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-4">Navigations</h4>
            <ul className="space-y-2.5 text-sm font-semibold">
              <li><a href="#home" className="hover:text-teal-400 transition-colors">Home</a></li>
              <li><a href="#services" className="hover:text-teal-400 transition-colors">Treatments</a></li>
              <li><a href="#about" className="hover:text-teal-400 transition-colors">The Doctor</a></li>
              <li><a href="#branches" className="hover:text-teal-400 transition-colors">Branches</a></li>
              <li><a href="#book" className="hover:text-teal-400 transition-colors text-teal-400">Book Appointment</a></li>
            </ul>
          </div>

          {/* Branch Contact Info */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-4">Support Channels</h4>
            <ul className="space-y-3 text-xs font-semibold">
              <li>
                <span className="block text-slate-500">Karur Clinic:</span>
                <a href="tel:+917598126430" className="text-slate-350 hover:text-white transition-colors">+91 75981 26430</a>
              </li>
              <li>
                <span className="block text-slate-500">Velayuthampalayam:</span>
                <a href="tel:+919443766998" className="text-slate-350 hover:text-white transition-colors">+91 94437 66998</a>
              </li>
              <li>
                <span className="block text-slate-500">Email Enquiries:</span>
                <a href="mailto:info@abiskinclinic.com" className="text-slate-350 hover:text-white transition-colors">info@abiskinclinic.com</a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <div>
            &copy; {new Date().getFullYear()} ABI Skin & Hair Clinic. All rights reserved.
          </div>
          <div className="text-slate-500 font-medium text-center md:text-right max-w-md">
            Disclaimer: This is a premium proposal/pitch demo design for ABI Skin & Hair Clinic. All medical information and trademarks are properties of their respective owners.
          </div>
        </div>

      </div>
    </footer>
  );
}
