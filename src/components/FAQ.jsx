import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: "Who is the chief doctor at Dr. Srinivasan's Abi Skin & Hair Clinic?",
    answer: "The chief dermatologist and trichologist is Dr. G. Srinivasan, MBBS, D.D. (Dermatology). He is an alumnus of the prestigious Madras Medical College and has over 16+ years of clinical experience specializing in advanced clinical dermatology, trichology, hair restoration, and aesthetic lasers."
  },
  {
    question: "What are the timings and schedules of the Karur and Velayuthampalayam branches?",
    answer: "We serve patients at two branches: \n• Karur Branch: Open Monday to Saturday (9:00 AM - 1:00 PM and 4:00 PM - 8:30 PM). Located behind Easwaran Kovil, Madavilagam.\n• Velayuthampalayam Branch: Open Monday to Saturday (5:30 PM - 8:30 PM). Located near Pugali Mandapam on the Bypass."
  },
  {
    question: "What treatments are available for active hair fall and thinning?",
    answer: "We evaluate hair loss and alopecia to identify likely causes, then create an appropriate medical treatment and follow-up plan for each patient."
  },
  {
    question: "Do I need a prior appointment to consult the doctor?",
    answer: "Yes, we highly recommend scheduling a consultation using our online appointment portal or by calling/messaging us. Booking in advance secures your consultation slot and minimizes wait times at both our branches."
  },
  {
    question: "Are the aesthetic laser treatments safe?",
    answer: "Laser and IPL procedures are performed under Dr. G. Srinivasan's supervision after a suitability assessment. Benefits, risks, alternatives and aftercare are explained before treatment."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 px-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-200/50 dark:border-slate-800/40 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-teal-500/5 rounded-full filter blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-indigo-500/5 rounded-full filter blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-4xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-bold uppercase tracking-widest">
            <HelpCircle className="w-3.5 h-3.5" />
            Frequently Asked Questions
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Have Questions? We Have Answers
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base font-semibold max-w-lg mx-auto">
            Get clear information about consultations, timings, and clinical treatment procedures at our clinics.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div 
                key={index}
                className="group border border-slate-200/60 dark:border-slate-800/40 rounded-2xl bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between p-6 text-left cursor-pointer focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    {faq.question}
                  </span>
                  <div className={`p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-all duration-300 ${isOpen ? 'rotate-180 bg-teal-500/10 text-teal-600 dark:text-teal-400' : ''}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>
                <div 
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-60 border-t border-slate-100 dark:border-slate-800/50' : 'max-h-0'}`}
                >
                  <p className="p-6 text-xs sm:text-sm text-slate-600 dark:text-slate-350 leading-relaxed font-semibold whitespace-pre-line">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
