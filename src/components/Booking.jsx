import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Calendar, CheckCircle2, LoaderCircle, MapPin, Phone, ShieldCheck, Sparkles, User } from 'lucide-react';
import { api, formatTime, getClinicDateString, getMaximumBookingDate, getPublicBootstrap } from '../lib/api';

const EMPTY = { branchId: '', serviceId: '', date: '', timeSlot: '', name: '', phone: '', notes: '', consent: false };

export default function Booking() {
  const [form, setForm] = useState(EMPTY);
  const [config, setConfig] = useState({ branches: [], services: [] });
  const [slots, setSlots] = useState([]);
  const [slotMessage, setSlotMessage] = useState('Choose a branch and date.');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState(null);
  const [slotsVersion, setSlotsVersion] = useState(0);

  useEffect(() => {
    let active = true;
    getPublicBootstrap().then((data) => active && setConfig(data)).catch((requestError) => active && setError(requestError.message));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!form.branchId || !form.date) {
      setSlots([]);
      return;
    }
    const controller = new AbortController();
    // Clear the previous date's slots so they cannot be picked if this request fails.
    setSlots([]);
    setLoading(true);
    api(`/api/public/availability?branch=${encodeURIComponent(form.branchId)}&date=${encodeURIComponent(form.date)}`, { signal: controller.signal })
      .then((data) => {
        setSlots(data.slots || []);
        setSlotMessage(data.slots?.length ? 'Live availability from the clinic calendar.' : (data.reason || 'No slots available.'));
        setForm((current) => data.slots?.includes(current.timeSlot) ? current : { ...current, timeSlot: '' });
      })
      .catch((requestError) => requestError.name !== 'AbortError' && setSlotMessage(requestError.message))
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [form.branchId, form.date, slotsVersion]);

  const branch = useMemo(() => config.branches.find((item) => item.id === form.branchId), [config.branches, form.branchId]);
  const service = useMemo(() => config.services.find((item) => item.id === form.serviceId), [config.services, form.serviceId]);

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (!form.branchId || !form.serviceId || !form.date || !form.timeSlot) return setError('Choose a branch, treatment, date and live time slot.');
    if (form.name.trim().length < 2) return setError('Enter the patient name.');
    const digits = form.phone.replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, '');
    if (!/^[6-9]\d{9}$/.test(digits)) return setError('Enter a valid 10-digit Indian mobile number.');
    if (!form.consent) return setError('Consent is required to process the appointment.');
    setLoading(true);
    try {
      const result = await api('/api/public/appointments', { method: 'POST', body: JSON.stringify(form) });
      setBooking({ ...result.appointment, phone: digits, whatsappAcknowledgement: result.whatsappAcknowledgement, smsAcknowledgement: result.smsAcknowledgement });
    } catch (requestError) {
      setError(requestError.message);
      if (requestError.code === 'SLOT_UNAVAILABLE') {
        // Reload the slots so the one just taken disappears instead of failing again.
        setForm((current) => ({ ...current, timeSlot: '' }));
        setSlotsVersion((current) => current + 1);
      }
    } finally {
      setLoading(false);
    }
  }

  function messageClinic() {
    const number = String(branch?.phone || '+91 75981 26430').replace(/\D/g, '');
    const message = `Hello ABI Skin Clinic. Please confirm appointment request ${booking.reference} for ${booking.date} at ${formatTime(booking.timeSlot)}.`;
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  }

  return (
    <section id="book" className="py-24 px-6 bg-white dark:bg-slate-950">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-sm font-extrabold text-teal-700 uppercase tracking-widest">Live scheduling</span>
          <h2 className="mt-3 text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white">Request an Appointment</h2>
          <p className="mt-4 text-slate-500 font-medium">Slots come from the doctor-managed calendar and are protected against double booking.</p>
        </div>
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30 p-6 sm:p-10 shadow-xl">
          {booking ? (
            <div className="text-center py-6 space-y-6" aria-live="polite">
              <CheckCircle2 className="w-16 h-16 mx-auto text-teal-600" />
              <div><h3 className="text-2xl font-extrabold">Appointment request received</h3><p className="mt-2 text-sm text-slate-500">{booking.smsAcknowledgement || booking.whatsappAcknowledgement ? `A confirmation ${booking.smsAcknowledgement ? 'SMS' : 'WhatsApp message'} is being sent to +91 ${booking.phone}. ` : ''}The clinic will confirm the appointment{booking.smsAcknowledgement ? ' by SMS' : booking.whatsappAcknowledgement ? ' on WhatsApp' : ' by phone or WhatsApp'}. Save your reference number to track it.</p></div>
              <div className="max-w-md mx-auto text-left rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 text-sm space-y-2">
                <p><strong>Reference:</strong> <span className="text-teal-600">{booking.reference}</span></p><p><strong>Treatment:</strong> {booking.service}</p><p><strong>Date:</strong> {booking.date} at {formatTime(booking.timeSlot)}</p><p><strong>Status:</strong> Awaiting clinic confirmation</p>
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-3"><button onClick={messageClinic} className="inline-flex justify-center items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-bold text-sm"><Phone className="w-4 h-4" />Message clinic</button><button onClick={() => { setBooking(null); setForm(EMPTY); }} className="px-6 py-3 rounded-xl bg-slate-200 dark:bg-slate-800 font-bold text-sm">New request</button></div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-7">
              <fieldset><legend className="flex items-center gap-2 font-bold mb-3"><MapPin className="w-5 h-5 text-teal-600" />Clinic location</legend><div className="grid sm:grid-cols-2 gap-3">{config.branches.map((item) => <button key={item.id} type="button" onClick={() => setForm((current) => ({ ...current, branchId: item.id, date: '', timeSlot: '' }))} className={`p-4 rounded-xl border text-left ${form.branchId === item.id ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/30' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950'}`}><strong className="block">{item.name}</strong><span className="block mt-1 text-xs text-slate-500">{item.address}</span></button>)}</div></fieldset>
              <label className="block"><span className="flex items-center gap-2 font-bold mb-3"><Sparkles className="w-5 h-5 text-teal-600" />Treatment</span><select required value={form.serviceId} onChange={(event) => setForm((current) => ({ ...current, serviceId: event.target.value }))} className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"><option value="">Select a treatment</option>{config.services.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <div className="grid md:grid-cols-2 gap-5"><label className="block"><span className="flex items-center gap-2 font-bold mb-3"><Calendar className="w-5 h-5 text-teal-600" />Date</span><input required type="date" min={getClinicDateString()} max={getMaximumBookingDate()} value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value, timeSlot: '' }))} className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950" /></label><div><span className="block font-bold mb-3">Available time</span><div className="grid grid-cols-3 gap-2">{slots.map((slot) => <button key={slot} type="button" onClick={() => setForm((current) => ({ ...current, timeSlot: slot }))} className={`min-h-11 rounded-xl border text-xs font-bold ${form.timeSlot === slot ? 'bg-teal-600 border-teal-600 text-white' : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800'}`}>{formatTime(slot)}</button>)}</div><p className="mt-2 text-xs text-slate-500" aria-live="polite">{loading ? 'Loading live slots…' : slotMessage}</p></div></div>
              <div className="grid sm:grid-cols-2 gap-4"><label className="block"><span className="flex items-center gap-2 text-sm font-bold mb-2"><User className="w-4 h-4" />Patient name</span><input required autoComplete="name" maxLength="100" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950" /></label><label className="block"><span className="flex items-center gap-2 text-sm font-bold mb-2"><Phone className="w-4 h-4" />Mobile</span><input required autoComplete="tel" inputMode="tel" maxLength="16" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950" /></label></div>
              <label className="block text-sm font-bold">Brief note (optional)<textarea maxLength="500" rows="3" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Avoid sensitive details; discuss these privately with the doctor." className="mt-2 w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 resize-none" /></label>
              <label className="flex gap-3 text-xs text-slate-600 dark:text-slate-300"><input type="checkbox" checked={form.consent} onChange={(event) => setForm((current) => ({ ...current, consent: event.target.checked }))} /><span>I consent to the clinic storing these details for appointment management and contacting me by phone or WhatsApp.</span></label>
              {branch && service && form.date && form.timeSlot && <p className="rounded-xl bg-white dark:bg-slate-950 p-4 text-xs border border-slate-200 dark:border-slate-800"><strong>{branch.name}</strong> · {service.name} · {form.date} at {formatTime(form.timeSlot)}</p>}
              {error && <p role="alert" className="flex items-center gap-2 text-sm text-red-600"><AlertCircle className="w-4 h-4" />{error}</p>}
              <button disabled={loading} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-7 py-3.5 rounded-xl font-bold disabled:opacity-50">{loading ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}Store appointment request</button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
