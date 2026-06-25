import { motion } from 'framer-motion';
import { Award, BookOpen, HeartHandshake, ShieldCheck } from 'lucide-react';
import TiltedCard from './TiltedCard';
import doctorImg from '../assets/dr_srinivasan_real.png';

export default function About() {
  return (
    <section id="about" className="py-24 px-6 relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Image Column */}
          <div className="lg:col-span-5 flex justify-center">
            <TiltedCard tiltMaxAngleX={10} tiltMaxAngleY={10} className="w-full max-w-[400px]">
              <div className="relative group rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800">
                {/* Decorative border highlight */}
                <div className="absolute inset-0 bg-gradient-to-tr from-teal-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none" />
                <img 
                  src={doctorImg} 
                  alt="Dr. Srinivasan G." 
                  className="w-full h-auto object-cover transform group-hover:scale-103 transition-transform duration-500"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950/80 to-transparent p-6 text-white text-left z-20">
                  <span className="block font-extrabold text-lg">Dr. Srinivasan G.</span>
                  <span className="block text-xs text-teal-400 font-bold tracking-wider">MBBS, DD • Chief Dermatologist</span>
                </div>
              </div>
            </TiltedCard>
          </div>

          {/* Details Column */}
          <div className="lg:col-span-7">
            <span className="text-sm font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-widest block mb-3">Meet the Expert</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white mb-6 leading-tight">
              Dedicated to Skin Health & Aesthetic Excellence
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-8">
              Dr. Srinivasan G. is a highly trusted dermatologist and trichologist in the Karur and Velayuthampalayam region. With over 16 years of clinical practice, he specializes in treating complex dermatological conditions, custom hair restoration protocols, and advanced non-surgical facial aesthetics.
            </p>

            {/* Grid of Credentials */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Stat 1 */}
              <div className="flex gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/40">
                <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 shrink-0 h-fit">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">Clinical Experience</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Over 16 years of active, hands-on dermatology and trichology care.</p>
                </div>
              </div>

              {/* Stat 2 */}
              <div className="flex gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/40">
                <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 shrink-0 h-fit">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">Qualifications</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">MBBS, DD (Diploma in Dermatology) from premium medical institutes.</p>
                </div>
              </div>

              {/* Stat 3 */}
              <div className="flex gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/40">
                <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 shrink-0 h-fit">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">Professional Member</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active registered member of the national IADVL organization.</p>
                </div>
              </div>

              {/* Stat 4 */}
              <div className="flex gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/40">
                <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 shrink-0 h-fit">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">Patient-Centric Care</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Personalized diagnostic approaches ensuring safe, customized treatments.</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
