import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Calendar, User, Phone, MapPin, Sparkles, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';

const STEP_TITLES = ['Select Location', 'Choose Treatment', 'Select Date & Time', 'Patient Details'];

const SERVICES = [
  'Acne & Scar Treatment',
  'PRP Hair Growth Therapy',
  'Skin Whitening & Peels',
  'Hydrafacial & Polishing',
  'Laser Hair Reduction',
  'Carbon Laser Toning',
  'Eczema / Psoriasis Consultation',
  'Wart & Mole Removal',
  'General Skin Consultation'
];

export default function Booking() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    branch: '',
    service: '',
    date: '',
    timeSlot: '',
    name: '',
    phone: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [isBooked, setIsBooked] = useState(false);
  const [bookingId, setBookingId] = useState('');

  // Available timeslots based on branch hours
  const getTimeSlotsForBranch = () => {
    if (formData.branch === 'Velayuthampalayam') {
      return ['05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM'];
    }
    // Karur branch has morning & evening slots
    return [
      '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM',
      '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM'
    ];
  };

  const handleNext = () => {
    const currentErrors = {};
    if (step === 1 && !formData.branch) currentErrors.branch = 'Please select a location';
    if (step === 2 && !formData.service) currentErrors.service = 'Please select a treatment';
    if (step === 3) {
      if (!formData.date) currentErrors.date = 'Please pick a date';
      if (!formData.timeSlot) currentErrors.timeSlot = 'Please select a time slot';
    }
    if (step === 4) {
      if (!formData.name.trim()) currentErrors.name = 'Patient name is required';
      if (!formData.phone.trim()) {
        currentErrors.phone = 'Contact number is required';
      } else if (!/^\d{10}$/.test(formData.phone.replace(/[\s-+]/g, '').slice(-10))) {
        currentErrors.phone = 'Please enter a valid 10-digit number';
      }
    }

    if (Object.keys(currentErrors).length > 0) {
      setErrors(currentErrors);
      return;
    }

    setErrors({});
    if (step < 4) {
      setStep(step + 1);
    } else {
      // Final Submit
      const randomId = 'ABI-' + Math.floor(100000 + Math.random() * 900000);
      setBookingId(randomId);
      setIsBooked(true);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setErrors({});
    }
  };

  const handleReset = () => {
    setFormData({
      branch: '',
      service: '',
      date: '',
      timeSlot: '',
      name: '',
      phone: '',
      notes: ''
    });
    setStep(1);
    setIsBooked(false);
    setBookingId('');
    setErrors({});
  };

  return (
    <section id="book" className="py-24 px-6 relative overflow-hidden bg-white dark:bg-slate-950">
      <div className="max-w-3xl mx-auto relative z-10">
        
        {/* Title */}
        <div className="text-center mb-12">
          <span className="text-sm font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-widest block mb-3">Scheduling</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white mb-4">
            Book an Appointment
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Automated scheduler slots. Select details below to book your consultation with Dr. Srinivasan.
          </p>
        </div>

        {/* Wizard Panel */}
        <div className="rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-xl dark:shadow-slate-950/40 p-6 sm:p-10 bg-slate-50/50 dark:bg-slate-950/20 backdrop-blur-md">
          
          {!isBooked ? (
            <>
              {/* Progress Steps */}
              <div className="mb-10 flex items-center justify-between overflow-x-auto pb-4 gap-4">
                {STEP_TITLES.map((title, i) => {
                  const stepNum = i + 1;
                  const isActive = step === stepNum;
                  const isCompleted = step > stepNum;
                  
                  return (
                    <div key={i} className="flex items-center gap-2 shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border transition-all ${
                        isCompleted
                          ? 'bg-teal-600 border-teal-600 text-white'
                          : isActive
                            ? 'bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 border-teal-600'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
                      }`}>
                        {isCompleted ? <Check className="w-4 h-4" /> : stepNum}
                      </div>
                      <span className={`text-xs font-bold uppercase tracking-wider hidden sm:inline ${
                        isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'
                      }`}>
                        {title}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Steps Animation wrapper */}
              <div className="min-h-[250px] mb-8">
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: -10, x: -10 }}
                      className="space-y-6"
                    >
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                        <MapPin className="w-5 h-5 text-teal-600" />
                        <span>Where would you like to visit?</span>
                      </h3>
                      {errors.branch && <p className="text-red-500 text-xs font-bold">{errors.branch}</p>}
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, branch: 'Karur', timeSlot: '' })}
                          className={`p-6 rounded-2xl border text-left transition-all ${
                            formData.branch === 'Karur'
                              ? 'border-teal-600 bg-teal-50/40 dark:bg-teal-950/20 ring-1 ring-teal-600'
                              : 'border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900'
                          }`}
                        >
                          <span className="block font-bold text-slate-900 dark:text-white text-base">Karur Branch (Main)</span>
                          <span className="block text-xs text-slate-500 mt-2 font-semibold">Behind Easwaran Kovil</span>
                          <span className="block text-xs text-teal-600 dark:text-teal-400 mt-3 font-bold">Consulting hours: Morning & Evening</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, branch: 'Velayuthampalayam', timeSlot: '' })}
                          className={`p-6 rounded-2xl border text-left transition-all ${
                            formData.branch === 'Velayuthampalayam'
                              ? 'border-teal-600 bg-teal-50/40 dark:bg-teal-950/20 ring-1 ring-teal-600'
                              : 'border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900'
                          }`}
                        >
                          <span className="block font-bold text-slate-900 dark:text-white text-base">Velayuthampalayam Branch</span>
                          <span className="block text-xs text-slate-500 mt-2 font-semibold">Valluvar Nagar (Near Medicals)</span>
                          <span className="block text-xs text-teal-600 dark:text-teal-400 mt-3 font-bold">Consulting hours: Evening Only</span>
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: -10, x: -10 }}
                      className="space-y-6"
                    >
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-teal-600" />
                        <span>Select the treatment you require</span>
                      </h3>
                      {errors.service && <p className="text-red-500 text-xs font-bold">{errors.service}</p>}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
                        {SERVICES.map((srv) => (
                          <button
                            key={srv}
                            type="button"
                            onClick={() => setFormData({ ...formData, service: srv })}
                            className={`p-4 rounded-xl border text-left transition-all text-sm font-semibold ${
                              formData.service === srv
                                ? 'border-teal-600 bg-teal-50/40 dark:bg-teal-950/20 text-teal-700 dark:text-teal-450 ring-1 ring-teal-600'
                                : 'border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {srv}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: -10, x: -10 }}
                      className="space-y-6"
                    >
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                        <Calendar className="w-5 h-5 text-teal-600" />
                        <span>Choose appointment date & slot</span>
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Date Picker */}
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Date</label>
                          <input
                            type="date"
                            min={new Date().toISOString().split('T')[0]}
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-semibold text-sm outline-none focus:border-teal-600 text-slate-800 dark:text-slate-200"
                          />
                          {errors.date && <p className="text-red-500 text-xs font-bold mt-1">{errors.date}</p>}
                        </div>

                        {/* Slots */}
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Time Slot</label>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[220px] overflow-y-auto pr-1">
                            {getTimeSlotsForBranch().map((slot) => (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => setFormData({ ...formData, timeSlot: slot })}
                                className={`py-3 px-1 rounded-xl border text-center transition-all text-xs font-bold min-h-[44px] flex items-center justify-center cursor-pointer ${
                                  formData.timeSlot === slot
                                    ? 'bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-600/10'
                                    : 'border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-350'
                                }`}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                          {errors.timeSlot && <p className="text-red-500 text-xs font-bold mt-1">{errors.timeSlot}</p>}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {step === 4 && (
                    <motion.div
                      key="step4"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: -10, x: -10 }}
                      className="space-y-4"
                    >
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-2">
                        <User className="w-5 h-5 text-teal-600" />
                        <span>Enter patient information</span>
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Name */}
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                          <input
                            type="text"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 font-semibold text-sm outline-none focus:border-teal-600 text-slate-800 dark:text-slate-200"
                          />
                          {errors.name && <p className="text-red-500 text-xs font-bold mt-1">{errors.name}</p>}
                        </div>

                        {/* Phone */}
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Number</label>
                          <input
                            type="tel"
                            placeholder="9876543210"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 font-semibold text-sm outline-none focus:border-teal-600 text-slate-800 dark:text-slate-200"
                          />
                          {errors.phone && <p className="text-red-500 text-xs font-bold mt-1">{errors.phone}</p>}
                        </div>
                      </div>

                      {/* Notes */}
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Additional details (Optional)</label>
                        <textarea
                          rows="3"
                          placeholder="E.g., severity of hair fall, duration of acne, chemical allergies..."
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 font-semibold text-sm outline-none focus:border-teal-600 text-slate-800 dark:text-slate-200"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center border-t border-slate-200/50 dark:border-slate-800/40 pt-6">
                <button
                  type="button"
                  onClick={handleBack}
                  className={`flex items-center gap-1.5 px-5 py-3 rounded-xl text-sm font-bold border transition-colors ${
                    step === 1
                      ? 'border-slate-200 text-slate-350 cursor-not-allowed opacity-50 dark:border-slate-800'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer'
                  }`}
                  disabled={step === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 py-3 rounded-xl shadow-md shadow-teal-600/10 transition-colors text-sm cursor-pointer"
                >
                  <span>{step === 4 ? 'Confirm & Book' : 'Continue'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            /* Success State */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8 space-y-6"
            >
              <div className="w-16 h-16 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto shadow-inner border border-teal-200/20">
                <CheckCircle2 className="w-10 h-10 animate-pulse" />
              </div>
              
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">Booking Confirmed!</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
                  Your appointment slot has been successfully blocked in our clinic calendar database.
                </p>
              </div>

              {/* Receipt Panel */}
              <div className="max-w-md mx-auto p-6 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/80 text-left space-y-3 shadow-sm">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-900 pb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Booking ID</span>
                  <span className="text-sm font-extrabold text-teal-600 dark:text-teal-400">{bookingId}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <span>Patient Name:</span>
                  <span className="text-slate-950 dark:text-white">{formData.name}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <span>Location:</span>
                  <span className="text-slate-950 dark:text-white">{formData.branch} Branch</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <span>Treatment:</span>
                  <span className="text-slate-950 dark:text-white text-right max-w-[200px] truncate">{formData.service}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <span>Date & Slot:</span>
                  <span className="text-slate-950 dark:text-white">{formData.date} at {formData.timeSlot}</span>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-3 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-355 font-bold rounded-xl text-sm transition-colors cursor-pointer"
                >
                  Book Another Appointment
                </button>
                <a
                  href="#home"
                  className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm transition-colors shadow-md shadow-teal-600/10 text-center"
                >
                  Go to Home
                </a>
              </div>
            </motion.div>
          )}

        </div>

      </div>
    </section>
  );
}
