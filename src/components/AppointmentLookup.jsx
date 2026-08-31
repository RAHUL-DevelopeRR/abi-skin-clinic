import { useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, Calendar, MapPin, Phone, Search, Sparkles, X, Star } from 'lucide-react';
import { api, formatTime } from '../lib/api';

export default function AppointmentLookup({ isOpen, onClose }) {
  const [reference, setReference] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setResult(null);

    const ref = reference.trim().toUpperCase();
    const digits = phone.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');

    if (!ref) {
      setError('Please enter your appointment reference code.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(digits)) {
      setError('Enter the 10-digit mobile number used during booking.');
      return;
    }

    setLoading(true);
    try {
      const data = await api(`/api/public/appointments/status?reference=${encodeURIComponent(ref)}&phone=${encodeURIComponent(digits)}`);
      setResult(data.appointment);
    } catch (err) {
      setError(err.message || 'No appointment found with those details.');
    } finally {
      setLoading(false);
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <Sparkles className="w-3.5 h-3.5" /> Consultation Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
            <AlertCircle className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
      case 'requested':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3.5 h-3.5" /> Awaiting Confirmation
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">Track Your Appointment</h3>
          <p className="mt-1 text-xs text-slate-500">Check the live status of your clinic visit</p>
        </div>

        {/* Lookup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Reference Code
            </label>
            <input
              type="text"
              required
              placeholder="e.g. ABI-20260822-ABC123"
              value={reference}
              onChange={(e) => setReference(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 font-mono text-sm font-semibold tracking-wider focus:outline-none focus:ring-2 focus:ring-teal-500 uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Registered Phone Number
            </label>
            <input
              type="tel"
              required
              placeholder="10-digit mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Checking Status…
              </span>
            ) : (
              'Check Live Status'
            )}
          </button>
        </form>

        {/* Result Card */}
        {result && (
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block font-mono font-bold">{result.reference}</span>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">{result.patientName}</h4>
              </div>
              {getStatusBadge(result.status)}
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs space-y-2.5">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
                <span><strong>Treatment:</strong> {result.serviceName}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
                <span><strong>Date:</strong> {result.date} at {formatTime(result.timeSlot)}</span>
              </div>
              <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span><strong>Location:</strong> {result.branchName} ({result.branchAddress})</span>
              </div>
            </div>

            {result.adminNotes && (
              <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-xs text-teal-800 dark:text-teal-200">
                <strong>Clinic Note:</strong> {result.adminNotes}
              </div>
            )}

            {result.status === 'completed' && result.reviewToken && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center space-y-2">
                <p className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center justify-center gap-1.5">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  How was your experience with Dr. Srinivasan?
                </p>
                <a
                  href={`/?review=${result.reviewToken}#reviews`}
                  onClick={onClose}
                  className="inline-block px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors shadow-sm"
                >
                  Leave a Verified Review
                </a>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <a
                href={`tel:${result.branchPhone}`}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-teal-600" />
                Call Clinic
              </a>
              <a
                href={`https://wa.me/${result.branchPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ABI Clinic, regarding appointment ${result.reference}:`)}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition-colors"
              >
                WhatsApp Us
              </a>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
