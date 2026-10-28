import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BellRing, CheckCircle2, ClipboardList, Clock3, Copy, Eye, EyeOff, Film, LayoutDashboard,
  ExternalLink, LoaderCircle, LogOut, MapPinned, MessageCircle, MessageSquareQuote, MessageSquareText,
  Navigation, Palmtree, Phone, RefreshCw, Save, Send, ShieldCheck, Smartphone, Star, Trash2, Upload, Wifi, WifiOff, XCircle,
} from 'lucide-react';
import { App } from '@capacitor/app';
import { api, formatTime, getLocalDateString } from '../lib/api';
import {
  AppointmentAlerts, copyText, enableAppointmentNotifications, externalLinkProps, getPushToken, hasAppointmentAlerts,
  hasNativeVideoUploader, hasSmsGateway, isNativeApp, monitorNativeApp, notifyNewAppointments, openExternal,
  registerPushNotifications, SmsGateway, VideoUploader,
} from '../lib/native';
import { formatMegabytes, MAX_VIDEO_BYTES, titleFromFileName, tooLargeMessage, uploadVideo } from '../lib/videos';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const STATUSES = ['requested', 'confirmed', 'completed', 'cancelled', 'no_show'];
const STATUS_LABELS = { requested: 'Requested', confirmed: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled', no_show: 'No-show' };
const TABS = [
  ['overview', 'Overview', LayoutDashboard],
  ['appointments', 'Appointments', ClipboardList],
  ['schedule', 'Working days', Clock3],
  ['leaves', 'Leave days', Palmtree],
  ['reviews', 'Reviews', MessageSquareQuote],
  ['videos', 'Videos', Film],
  ['clinics', 'Clinics', MapPinned],
  ['sms', 'SMS phone', Smartphone],
];

function Loading() {
  return <div className="py-20 flex justify-center"><LoaderCircle className="w-8 h-8 animate-spin text-teal-600" /></div>;
}

function Empty({ children }) {
  return <p className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-sm text-slate-500">{children}</p>;
}

function statusClass(status) {
  if (status === 'confirmed' || status === 'completed' || status === 'approved') return 'bg-green-100 text-green-700';
  if (status === 'cancelled' || status === 'rejected' || status === 'no_show') return 'bg-red-100 text-red-700';
  return 'bg-amber-100 text-amber-700';
}

function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api('/api/admin/login', { method: 'POST', body: JSON.stringify({ password }) });
      onLogin();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="min-h-screen bg-slate-950 text-white grid place-items-center p-6">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <ShieldCheck className="w-12 h-12 text-teal-400" />
        <h1 className="mt-5 text-3xl font-extrabold">Doctor Dashboard</h1>
        <p className="mt-2 text-sm text-slate-400">Secure access to appointments, availability and verified reviews.</p>
        <label className="block mt-7 text-xs font-bold uppercase tracking-wider text-slate-400">Admin password
          <input autoFocus required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-3.5 text-white focus-visible:outline-2 focus-visible:outline-teal-500" />
        </label>
        {error && <p className="mt-4 text-sm text-red-400" role="alert">{error}</p>}
        <button disabled={loading} className="mt-6 w-full rounded-xl bg-teal-600 px-5 py-3.5 font-bold disabled:opacity-50">{loading ? 'Signing in…' : 'Sign in'}</button>
        {!isNativeApp && <a href="/" className="mt-5 block text-center text-xs text-slate-500 hover:text-white">Return to clinic website</a>}
      </form>
    </main>
  );
}

function Overview({ data, ringRegistered }) {
  const stats = data?.stats || {};
  const cards = [['Today', stats.today], ['New requests', stats.requested], ['Upcoming confirmed', stats.upcomingConfirmed], ['Completed', stats.completed], ['Reviews pending', stats.pendingReviews]];
  return <div className="space-y-8"><RequestAlerts registered={ringRegistered} /><div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4">{cards.map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5"><p className="text-xs font-bold uppercase text-slate-500">{label}</p><p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">{value || 0}</p></div>)}</div><div><h2 className="text-xl font-bold mb-4">Latest appointment requests</h2>{data?.recentAppointments?.length ? <div className="space-y-3">{data.recentAppointments.map((item) => <div key={item.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-wrap justify-between gap-3"><div><strong>{item.patient_name}</strong><p className="text-xs text-slate-500">{item.reference} · {item.service_name}</p></div><div className="text-right text-sm"><p>{item.appointment_date} · {formatTime(item.time_slot)}</p><span className={`inline-block mt-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase ${statusClass(item.status)}`}>{STATUS_LABELS[item.status] || item.status}</span></div></div>)}</div> : <Empty>No appointments yet.</Empty>}</div></div>;
}

const DELIVERY_LABELS = { queued: 'waiting for phone', sending: 'sending', sent: 'sent', delivered: 'delivered', failed: 'failed' };

function formatStamp(value) {
  return new Date(`${value.replace(' ', 'T')}Z`).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function DeliveryBadge({ label, notification, offText }) {
  if (!notification) return offText ? <p className="text-[11px] text-slate-500">{offText}</p> : null;
  const good = notification.status === 'sent' || notification.status === 'delivered';
  const bad = notification.status === 'failed';
  const tone = good ? 'text-green-600' : bad ? 'text-red-500' : 'text-amber-600';
  return <p title={notification.error || ''} className={`text-[11px] font-semibold ${tone}`}>{good ? '✓' : bad ? '✗' : '…'} {label} {DELIVERY_LABELS[notification.status] || notification.status} ({notification.event}) · {formatStamp(notification.created_at)}{bad && notification.error ? ` — ${notification.error}` : ''}</p>;
}

function statusOptionLabel(current, status) {
  return current === 'requested' && status === 'cancelled' ? 'Reject' : STATUS_LABELS[status];
}

function AppointmentCard({ item, autoWhatsApp, smsSender, onUpdate, onResend, onCopy }) {
  const message = item.patient_message || '';
  const hasAutoMessage = item.status !== 'no_show';
  return <article className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0"><strong className="block truncate">{item.patient_name}</strong><p className="text-xs text-slate-500">{item.reference}</p></div>
      <select aria-label="Appointment status" value={item.status} onChange={(event) => onUpdate(item, event.target.value)} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold ${statusClass(item.status)}`}>{STATUSES.map((status) => <option key={status} value={status}>{statusOptionLabel(item.status, status)}</option>)}</select>
    </div>
    <p className="mt-3 text-sm font-semibold">{item.appointment_date} · {formatTime(item.time_slot)}</p>
    <p className="text-xs text-slate-500">{item.service_name} · {item.branch_name}</p>
    {item.notes && <p className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-600 dark:bg-slate-950 dark:text-slate-300">{item.notes}</p>}
    <a href={`tel:+91${item.phone}`} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-teal-600"><Phone className="h-4 w-4" />+91 {item.phone}</a>
    <div className="mt-1 space-y-0.5">
      <DeliveryBadge label="SMS" notification={item.last_sms} offText={smsSender ? 'No automatic SMS yet' : 'Auto-SMS off · register a phone in SMS phone'} />
      <DeliveryBadge label="WhatsApp" notification={item.last_whatsapp} offText={autoWhatsApp ? 'No automatic WhatsApp yet' : null} />
    </div>
    {message && <div className="mt-3 grid grid-cols-2 gap-2">
      <a {...externalLinkProps(`https://wa.me/91${item.phone}?text=${encodeURIComponent(message)}`)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-3 py-2.5 text-xs font-bold text-white"><MessageCircle className="h-4 w-4" />WhatsApp</a>
      <a {...externalLinkProps(`sms:+91${item.phone}?body=${encodeURIComponent(message)}`)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold dark:border-slate-700"><MessageSquareText className="h-4 w-4" />SMS</a>
    </div>}
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
      {smsSender && hasAutoMessage && <button type="button" onClick={() => onResend(item, 'sms')} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-teal-600"><Send className="h-3 w-3" />Resend automatic SMS</button>}
      {autoWhatsApp && hasAutoMessage && <button type="button" onClick={() => onResend(item, 'whatsapp')} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-teal-600"><Send className="h-3 w-3" />Resend automatic WhatsApp</button>}
      {item.status === 'completed' && item.google_review_link && <button type="button" onClick={() => onCopy(item.google_review_link)} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-teal-600"><Copy className="h-3 w-3" />Copy Google review link</button>}
    </div>
  </article>;
}

function Appointments({ appointments, autoWhatsApp, smsSender, onUpdate, onResend, onCopy }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [older, setOlder] = useState([]);
  const query = search.trim();
  // The dashboard holds only the latest 200 appointments, so searches and status filters also
  // ask the server; older visits can then still be found and updated.
  useEffect(() => {
    if (!query && filter === 'all') return undefined;
    const params = new URLSearchParams();
    if (query) params.set('search', query);
    if (filter !== 'all') params.set('status', filter);
    let active = true;
    const timer = window.setTimeout(() => {
      api(`/api/admin/appointments?${params}`).then((result) => { if (active) setOlder(result.appointments); }).catch(() => {});
    }, 300);
    return () => { active = false; window.clearTimeout(timer); };
  }, [query, filter, appointments]);
  const pool = useMemo(() => {
    if (!query && filter === 'all') return appointments;
    const byId = new Map(older.map((item) => [item.id, item]));
    appointments.forEach((item) => byId.set(item.id, item));
    return [...byId.values()].sort((left, right) => `${right.appointment_date} ${right.time_slot}`.localeCompare(`${left.appointment_date} ${left.time_slot}`));
  }, [appointments, older, query, filter]);
  const filtered = pool.filter((item) => (filter === 'all' || item.status === filter) && [item.patient_name, item.reference, item.phone].some((value) => String(value).toLowerCase().includes(search.toLowerCase())));
  return <div><div className="mb-5 flex flex-col sm:flex-row gap-3"><input placeholder="Search patient, phone or reference" value={search} onChange={(event) => setSearch(event.target.value)} className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3" /><select value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3"><option value="all">All statuses</option>{STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}</select></div>{filtered.length ? <div className="grid gap-3 lg:grid-cols-2">{filtered.map((item) => <AppointmentCard key={item.id} item={item} autoWhatsApp={autoWhatsApp} smsSender={smsSender} onUpdate={onUpdate} onResend={onResend} onCopy={onCopy} />)}</div> : <Empty>No matching appointments.</Empty>}</div>;
}

function timeAgo(value) {
  if (!value) return 'never';
  const minutes = Math.round((Date.now() - new Date(`${value.replace(' ', 'T')}Z`).getTime()) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 1440) return `${Math.round(minutes / 60)} h ago`;
  return `${Math.round(minutes / 1440)} days ago`;
}

/** Registers the phone running ABI Doctor as the clinic's automatic SMS sender. */
function SmsPhone({ sender, onRegister, onRemove, onTest, onLimit, notify }) {
  const [device, setDevice] = useState(null);
  const [form, setForm] = useState({ phone: sender?.phone || '', dailyLimit: sender?.dailyLimit || 100 });
  const [testPhone, setTestPhone] = useState('');
  const [log, setLog] = useState([]);
  const [permissionAsked, setPermissionAsked] = useState(false);
  const refreshDevice = useCallback(() => {
    if (hasSmsGateway) SmsGateway.getStatus().then(setDevice).catch(() => setDevice(null));
  }, []);
  const refreshLog = useCallback(() => {
    api('/api/admin/sms-sender/log').then((result) => setLog(result.log)).catch(() => {});
  }, []);
  useEffect(() => { refreshDevice(); refreshLog(); }, [refreshDevice, refreshLog, sender]);
  useEffect(() => {
    if (!isNativeApp) return undefined;
    let handle;
    App.addListener('appStateChange', ({ isActive }) => { if (isActive) refreshDevice(); }).then((h) => { handle = h; });
    return () => handle?.remove();
  }, [refreshDevice]);
  const thisPhone = Boolean(device?.registered);
  // After "Don't allow" twice Android stops asking, so the only way back is app settings.
  const showPermissionHelp = Boolean(device && !device.permission && (permissionAsked || thisPhone));

  async function register(event) {
    event.preventDefault();
    const permission = await SmsGateway.requestSmsPermission();
    if (!permission.granted) {
      setPermissionAsked(true);
      refreshDevice();
      notify('', 'Allow SMS permission for ABI Doctor so it can text patients.');
      return;
    }
    await onRegister({ ...form, deviceName: device?.deviceName || '', pushToken: getPushToken() });
    refreshDevice();
  }

  return <div className="space-y-5">
    <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="flex items-center gap-2 text-lg font-extrabold"><Smartphone className="h-5 w-5 text-teal-600" />Patient SMS phone</h2>
      <p className="mt-1 text-sm text-slate-500">One Android phone running ABI Doctor sends patient SMS from its own SIM and recharge pack: on booking, confirm, reject, cancel and completed visits.</p>
      {sender ? <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div><dt className="text-xs font-bold uppercase text-slate-500">Sending number</dt><dd className="font-semibold">+91 {sender.phone}</dd></div>
        <div><dt className="text-xs font-bold uppercase text-slate-500">Phone</dt><dd className="font-semibold">{sender.deviceName || 'Android phone'}{thisPhone ? ' (this phone)' : ''}</dd></div>
        <div><dt className="text-xs font-bold uppercase text-slate-500">Last checked in</dt><dd className="font-semibold">{timeAgo(sender.lastSeenAt)}</dd></div>
        <div><dt className="text-xs font-bold uppercase text-slate-500">Sent today</dt><dd className="font-semibold">{sender.sentToday} / {sender.dailyLimit}</dd></div>
        <div className="col-span-2"><dt className="text-xs font-bold uppercase text-slate-500">Instant wake-up</dt><dd className="font-semibold">{sender.wakeUpEnabled ? 'On (Firebase)' : 'Off — the phone checks every 15 minutes'}</dd></div>
      </dl> : <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">No phone is registered. Automatic SMS is off.</p>}
    </section>

    {hasSmsGateway ? <form onSubmit={register} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="font-bold">{thisPhone ? 'Update this phone' : 'Use this phone to send patient SMS'}</h3>
      {device && !device.canSendSms && <p className="mt-2 text-sm text-red-600">This device has no SIM or cannot send SMS.</p>}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-bold uppercase text-slate-500">SIM mobile number<input required inputMode="tel" maxLength="16" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} placeholder="10-digit number of this SIM" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm normal-case dark:border-slate-700 dark:bg-slate-950" /></label>
        <label className="text-xs font-bold uppercase text-slate-500">Daily SMS limit<input required type="number" min="1" max="1000" value={form.dailyLimit} onChange={(event) => setForm((current) => ({ ...current, dailyLimit: Number(event.target.value) }))} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-950" /></label>
      </div>
      <p className="mt-2 text-xs text-slate-500">Most Indian packs include 100 SMS a day. Registering here replaces any other registered phone.</p>
      <button className="mt-4 rounded-xl bg-teal-600 px-5 py-3 text-sm font-bold text-white">{thisPhone ? 'Save and re-register' : 'Register this phone'}</button>
      {showPermissionHelp && <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-200">SMS permission is off, so this phone cannot text patients. In app settings open <strong>Permissions → SMS</strong> and choose <strong>Allow</strong>.<button type="button" onClick={() => SmsGateway.openAppSettings().catch(() => {})} className="mt-2 block font-bold underline">Open app settings</button></div>}
      {device && !device.batteryUnrestricted && <div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">Android may pause ABI Doctor in the background. Set ABI Doctor to <strong>Unrestricted / Don&apos;t optimise</strong> so SMS go out on time.<button type="button" onClick={() => SmsGateway.openBatterySettings()} className="mt-2 block font-bold underline">Open battery settings</button></div>}
    </form> : <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-slate-700">To register a sending phone, open ABI Doctor (version 1.1 or later) on the clinic's Android phone and come to this tab.</p>}

    {sender && <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="font-bold">Test and settings</h3>
      <form onSubmit={(event) => { event.preventDefault(); onTest(testPhone).then(refreshLog); }} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input required inputMode="tel" maxLength="16" value={testPhone} onChange={(event) => setTestPhone(event.target.value)} placeholder="Send a test SMS to (10-digit number)" className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-950" />
        <button className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white dark:bg-white dark:text-slate-950">Send test SMS</button>
      </form>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="text-xs font-bold uppercase text-slate-500">Daily SMS limit<input type="number" min="1" max="1000" value={form.dailyLimit} onChange={(event) => setForm((current) => ({ ...current, dailyLimit: Number(event.target.value) }))} className="mt-2 block w-28 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-950" /></label>
        <button type="button" onClick={() => onLimit(form.dailyLimit)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold dark:border-slate-700">Save daily limit</button>
        {/* Clear this phone only once the server has unregistered it, or queued SMS would wait forever. */}
        <button type="button" onClick={async () => { if (await onRemove() && thisPhone) await SmsGateway.clear(); refreshDevice(); }} className="rounded-xl bg-red-50 px-4 py-2.5 text-xs font-bold text-red-600 dark:bg-red-950/40">Stop automatic SMS (unregister)</button>
      </div>
    </section>}

    {log.length > 0 && <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between"><h3 className="font-bold">Recent SMS</h3><button type="button" onClick={refreshLog} className="text-xs font-bold text-teal-600">Refresh</button></div>
      <ul className="mt-3 divide-y divide-slate-100 text-sm dark:divide-slate-800">{log.map((entry) => <li key={entry.id} className="flex flex-wrap justify-between gap-2 py-2"><span><strong className="capitalize">{entry.event}</strong> · {entry.phone}{entry.reference ? ` · ${entry.reference}` : ''}</span><span className={entry.status === 'failed' ? 'text-red-500' : entry.status === 'sent' || entry.status === 'delivered' ? 'text-green-600' : 'text-amber-600'} title={entry.error || ''}>{DELIVERY_LABELS[entry.status]} · {formatStamp(entry.updated_at)}</span>{entry.error && <span className="w-full text-xs text-red-500">{entry.error}</span>}</li>)}</ul>
    </section>}
  </div>;
}

function Schedule({ data, onSave, onToggleService }) {
  const [branchId, setBranchId] = useState(data.branches?.[0]?.id || '');
  const source = useMemo(() => data.hours.filter((hour) => hour.branch_id === branchId), [data.hours, branchId]);
  const [days, setDays] = useState([]);
  // One appointment gap for the whole branch: a gap picker on every period read as a third
  // "timing" next to start and end, and the doctor could not tell what it was for.
  const [slotMinutes, setSlotMinutes] = useState(30);
  // Reset the editor only when the saved schedule itself changes (another branch, or a save),
  // not on every 30-second refresh, which used to wipe unsaved edits.
  const sourceKey = JSON.stringify(source);
  useEffect(() => {
    const saved = JSON.parse(sourceKey);
    setSlotMinutes(Number(saved[0]?.slot_minutes) || 30);
    setDays(DAYS.map((name, dayOfWeek) => ({ name, dayOfWeek, periods: saved.filter((hour) => hour.day_of_week === dayOfWeek).map((hour) => ({ startTime: hour.start_time, endTime: hour.end_time })) })));
  }, [sourceKey]);
  function updatePeriod(dayIndex, periodIndex, key, value) {
    setDays((current) => current.map((day, index) => index !== dayIndex ? day : { ...day, periods: day.periods.map((period, pIndex) => pIndex !== periodIndex ? period : { ...period, [key]: value }) }));
  }
  function toggleDay(dayIndex) {
    setDays((current) => current.map((day, index) => index !== dayIndex ? day : { ...day, periods: day.periods.length ? [] : [{ startTime: '09:00', endTime: '13:00' }] }));
  }
  function addPeriod(dayIndex) {
    setDays((current) => current.map((day, index) => index !== dayIndex || day.periods.length >= 3 ? day : { ...day, periods: [...day.periods, { startTime: '16:00', endTime: '20:00' }] }));
  }
  const firstStart = days.find((day) => day.periods.length)?.periods[0]?.startTime || '09:00';
  const [firstHour, firstMinute] = firstStart.split(':').map(Number);
  const exampleTimes = [0, 1, 2].map((step) => {
    const minutes = firstHour * 60 + firstMinute + step * slotMinutes;
    return formatTime(`${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`);
  }).join(', ');
  return <div className="space-y-8"><div className="flex flex-wrap gap-3 items-center"><select value={branchId} onChange={(event) => setBranchId(event.target.value)} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">{data.branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select><button onClick={() => onSave(branchId, days.flatMap((day) => day.periods.map((period) => ({ ...period, slotMinutes, dayOfWeek: day.dayOfWeek }))))} className="inline-flex items-center gap-2 bg-teal-600 text-white rounded-xl px-5 py-3 font-bold text-sm"><Save className="w-4 h-4" />Save schedule</button></div><div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"><label className="flex flex-wrap items-center gap-2 text-sm font-bold">Patients can book a time every<select value={slotMinutes} onChange={(event) => setSlotMinutes(Number(event.target.value))} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2">{[15, 20, 30, 45, 60].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}</select></label><p className="mt-2 text-xs text-slate-500">The booking page offers {exampleTimes} and so on. Below, set only when each day starts and ends.</p></div><div className="space-y-3">{days.map((day, dayIndex) => <div key={day.name} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"><div className="flex items-center justify-between gap-3"><label className="flex items-center gap-3 font-bold"><input type="checkbox" checked={day.periods.length > 0} onChange={() => toggleDay(dayIndex)} />{day.name}</label>{day.periods.length > 0 && day.periods.length < 3 && <button onClick={() => addPeriod(dayIndex)} className="text-xs text-teal-600 font-bold">+ Add period</button>}</div>{day.periods.length === 0 ? <p className="mt-2 text-xs text-slate-500">Closed</p> : <div className="mt-3 space-y-2">{day.periods.map((period, periodIndex) => <div key={`${day.name}-${periodIndex}`} className="flex flex-wrap items-center gap-2"><input aria-label={`${day.name} start`} type="time" value={period.startTime} onChange={(event) => updatePeriod(dayIndex, periodIndex, 'startTime', event.target.value)} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2" /><span>to</span><input aria-label={`${day.name} end`} type="time" value={period.endTime} onChange={(event) => updatePeriod(dayIndex, periodIndex, 'endTime', event.target.value)} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2" /><button aria-label="Remove period" onClick={() => setDays((current) => current.map((currentDay, index) => index !== dayIndex ? currentDay : { ...currentDay, periods: currentDay.periods.filter((_, pIndex) => pIndex !== periodIndex) }))} className="p-2 text-red-500"><Trash2 className="w-4 h-4" /></button></div>)}</div>}</div>)}</div><div><h3 className="font-bold mb-3">Bookable services</h3><div className="grid sm:grid-cols-2 gap-2">{data.services.map((service) => <label key={service.id} className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-sm"><input type="checkbox" checked={Boolean(service.active)} onChange={(event) => onToggleService(service.id, event.target.checked)} />{service.name}</label>)}</div></div></div>;
}

function Leaves({ leaves, branches, onCreate, onDelete }) {
  const [form, setForm] = useState({ date: getLocalDateString(), branchId: '', reason: 'Doctor unavailable' });
  return <div className="space-y-6"><form onSubmit={(event) => { event.preventDefault(); onCreate(form); }} className="grid md:grid-cols-4 gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5"><input required type="date" min={getLocalDateString()} value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3" /><select value={form.branchId} onChange={(event) => setForm((current) => ({ ...current, branchId: event.target.value }))} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3"><option value="">All branches</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select><input required minLength="2" maxLength="200" value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3" /><button className="rounded-xl bg-teal-600 text-white font-bold">Add leave day</button></form>{leaves.length ? <div className="space-y-3">{leaves.map((leave) => <div key={leave.id} className="flex justify-between gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"><div><strong>{leave.leave_date}</strong><p className="text-xs text-slate-500">{leave.branch_name || 'All branches'} · {leave.reason}</p></div><button onClick={() => onDelete(leave.id)} className="text-red-500"><Trash2 className="w-5 h-5" /></button></div>)}</div> : <Empty>No leave days configured.</Empty>}</div>;
}

// Each clinic's own Google Maps listing. Searching the branch name and address found nearby
// hospitals instead of Abi Skin & Hair Clinic (Velayuthampalayam), so Navigate targets the listing.
const BRANCH_PLACE_IDS = {
  karur: 'ChIJ09TzE7AvqjsRe-yJFgFIR9k',
  velayuthampalayam: 'ChIJi5dWULkrqjsRYyYqSKUBRiQ',
};

function ClinicCard({ branch, onSaveReviewLink }) {
  const [reviewLink, setReviewLink] = useState(branch.google_review_url || '');
  useEffect(() => setReviewLink(branch.google_review_url || ''), [branch.google_review_url]);
  const placeId = BRANCH_PLACE_IDS[branch.id];
  const mapsUrl = placeId
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent('Abi Skin and Hair Clinic')}&destination_place_id=${placeId}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${branch.name}, ${branch.address}`)}`;
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
    <div className="flex items-start gap-3"><MapPinned className="mt-1 h-6 w-6 shrink-0 text-teal-600" /><div><h2 className="font-extrabold">{branch.name}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{branch.address}</p></div></div>
    <div className="mt-5 grid grid-cols-2 gap-3">
      <button type="button" onClick={() => openExternal(mapsUrl)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-bold text-white"><Navigation className="h-4 w-4" />Navigate</button>
      <a href={`tel:${branch.phone}`} className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold dark:border-slate-700">Call clinic</a>
    </div>
    {branch.google_review_url && <button type="button" onClick={() => openExternal(branch.google_review_url)} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-teal-600">Open Google reviews <ExternalLink className="h-4 w-4" /></button>}
    <form onSubmit={(event) => { event.preventDefault(); onSaveReviewLink(branch.id, reviewLink); }} className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
      <label className="block text-xs font-bold uppercase text-slate-500"><Star className="mr-1 inline h-3 w-3" />Google review link
        <input type="url" value={reviewLink} onChange={(event) => setReviewLink(event.target.value)} placeholder="https://g.page/r/…/review" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm normal-case dark:border-slate-700 dark:bg-slate-950" />
      </label>
      <p className="mt-2 text-xs text-slate-500">Patients see this after submitting a verified review. Get it from Google Business Profile → Ask for reviews.</p>
      <button className="mt-3 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white dark:bg-white dark:text-slate-950">Save link</button>
    </form>
  </article>;
}

function Clinics({ branches, onSaveReviewLink }) {
  return <div className="grid gap-4 lg:grid-cols-2">{branches.map((branch) => <ClinicCard key={branch.id} branch={branch} onSaveReviewLink={onSaveReviewLink} />)}</div>;
}

function GoogleReviewLinks({ branches }) {
  const linked = branches.filter((branch) => branch.google_review_url);
  if (!linked.length) return null;
  return <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
    <h2 className="flex items-center gap-2 font-extrabold"><Star className="h-5 w-5 fill-amber-400 text-amber-400" />Review us on Google</h2>
    <p className="mt-1 text-xs text-slate-500">Opens each clinic's Google reviews. Completed patients get this link in their WhatsApp/SMS message.</p>
    <div className="mt-4 grid gap-2 sm:grid-cols-2">{linked.map((branch) => <button key={branch.id} type="button" onClick={() => openExternal(branch.google_review_url)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white dark:bg-white dark:text-slate-950">{branch.name}<ExternalLink className="h-4 w-4" /></button>)}</div>
  </section>;
}

function ReviewsAdmin({ reviews, branches, onModerate, onDelete }) {
  return <><GoogleReviewLinks branches={branches} />{reviews.length ? <div className="grid lg:grid-cols-2 gap-4">{reviews.map((review) => <article key={review.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5"><div className="flex justify-between gap-3"><div><strong>{review.patient_name}</strong><p className="text-xs text-slate-500">{review.reference} · {review.rating}/5</p></div><span className={`h-fit px-2 py-1 rounded-full text-[10px] font-bold uppercase ${statusClass(review.status)}`}>{review.status}</span></div><p className="my-4 text-sm text-slate-600 dark:text-slate-300">“{review.comment}”</p><div className="flex gap-2"><button onClick={() => onModerate(review.id, 'approved')} className="inline-flex items-center gap-1 rounded-lg bg-green-100 text-green-700 px-3 py-2 text-xs font-bold"><CheckCircle2 className="w-4 h-4" />Approve</button><button onClick={() => onModerate(review.id, 'rejected')} className="inline-flex items-center gap-1 rounded-lg bg-red-100 text-red-700 px-3 py-2 text-xs font-bold"><XCircle className="w-4 h-4" />Reject</button><button onClick={() => onDelete(review.id)} className="ml-auto text-red-500"><Trash2 className="w-4 h-4" /></button></div></article>)}</div> : <Empty>No website reviews yet.</Empty>}</>;
}

/** ABI Doctor 1.1.3+: the phone rings like a call for each new request until the doctor responds. */
function RequestAlerts({ registered }) {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [testQueued, setTestQueued] = useState(false);
  const refresh = useCallback(() => AppointmentAlerts.getStatus().then(setStatus).catch(() => {}), []);
  useEffect(() => {
    if (!hasAppointmentAlerts) return undefined;
    refresh();
    // Settings changed in Android come back with the app, so re-check on return.
    const handle = App.addListener('appStateChange', ({ isActive }) => { if (isActive) refresh(); });
    return () => { handle.then((listener) => listener.remove()).catch(() => {}); };
  }, [refresh]);
  if (!hasAppointmentAlerts || !status) return null;
  async function toggle() { setError(''); try { setStatus(await AppointmentAlerts.setRingEnabled({ enabled: !status.ringEnabled })); } catch (toggleError) { setError(toggleError.message); } }
  async function test() { setError(''); try { await AppointmentAlerts.test({ delaySeconds: 5 }); setTestQueued(true); window.setTimeout(() => setTestQueued(false), 8000); } catch (testError) { setError(testError.message); } }
  const warning = 'flex flex-wrap items-center justify-between gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200';
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="flex items-center gap-2 font-extrabold"><BellRing className="h-5 w-5 text-teal-600" />Ringing request alerts</h2><p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">{status.ringEnabled ? 'This phone rings for every new appointment request until you open ABI Doctor or tap Silence (up to 1 minute), even when it is locked.' : 'Ringing is off on this phone. New requests show a normal notification.'}</p></div><button type="button" onClick={toggle} className={`rounded-xl px-4 py-2.5 text-sm font-bold ${status.ringEnabled ? 'border border-slate-200 dark:border-slate-700' : 'bg-teal-600 text-white'}`}>{status.ringEnabled ? 'Turn ringing off' : 'Turn ringing on'}</button></div>
    <div className="mt-4 space-y-2">
      {!status.notificationsAllowed && <p className={warning}>Notifications are off for ABI Doctor, so requests cannot ring.<button type="button" onClick={() => AppointmentAlerts.openNotificationSettings()} className="font-bold underline">Turn on</button></p>}
      {status.notificationsAllowed && registered === false && <p className={warning}>This phone is not registered for request alerts yet, so new bookings cannot reach it. Allow notifications for ABI Doctor, then close and reopen the app. Test alert only checks this phone’s sound.</p>}
      {status.notificationsAllowed && status.ringEnabled && !status.ringChannelOn && <p className={warning}>“Ringing request alerts” is blocked or set to silent in Android settings, so requests only show a normal notification.<button type="button" onClick={() => AppointmentAlerts.openRingChannelSettings()} className="font-bold underline">Fix it</button></p>}
      {status.ringEnabled && !status.fullScreenAllowed && <p className={warning}>Allow full-screen alerts so a request shows over the lock screen.<button type="button" onClick={() => AppointmentAlerts.openFullScreenSettings()} className="font-bold underline">Allow</button></p>}
      {status.ringEnabled && status.xiaomi && [status.miuiLockScreen, status.miuiBackgroundPopups, status.miuiAutostart].some((allowed) => allowed !== true) && <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
        <p className="font-bold">Xiaomi phones need three more switches, or a locked phone only rings with the screen dark:</p>
        <ul className="mt-2 space-y-1">{[['Show on Lock screen', status.miuiLockScreen], ['Display pop-up windows while running in the background', status.miuiBackgroundPopups], ['Autostart', status.miuiAutostart]].map(([label, allowed]) => <li key={label} className="flex items-start gap-2">{allowed === true ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />}{label}</li>)}</ul>
        <div className="mt-3 flex flex-wrap gap-3"><button type="button" onClick={() => AppointmentAlerts.openXiaomiPermissions()} className="font-bold underline">Open lock-screen permissions</button><button type="button" onClick={() => AppointmentAlerts.openAppInfo()} className="font-bold underline">Open Autostart</button></div>
      </div>}
    </div>
    <div className="mt-4 flex flex-wrap items-center gap-3"><button type="button" onClick={test} disabled={testQueued} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60 dark:bg-white dark:text-slate-950"><BellRing className="h-4 w-4" />{testQueued ? 'Ringing in 5 seconds…' : 'Test alert'}</button><p className="text-xs text-slate-500">Rings in 5 seconds. Lock the phone to see the full-screen alert.</p></div>
    {error && <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>}
  </section>;
}

const VIDEO_STAGE_LABELS = { compressing: 'Compressing to under 100 MB', uploading: 'Uploading' };

function VideoCard({ video, uploading, onPatch, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(video.title);
  const [description, setDescription] = useState(video.description);
  useEffect(() => { setTitle(video.title); setDescription(video.description); }, [video.title, video.description]);
  const ready = video.status === 'ready';
  return <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
    {ready ? <video src={`/api/admin/videos/${video.id}/file#t=0.1`} controls playsInline preload="metadata" className="aspect-video w-full bg-black" /> : <div className="flex aspect-video items-center justify-center bg-slate-100 text-sm text-slate-500 dark:bg-slate-950">Upload not finished</div>}
    <div className="space-y-3 p-4">
      {editing ? <form onSubmit={async (event) => { event.preventDefault(); if (await onPatch(video.id, { title, description })) setEditing(false); }} className="space-y-2"><input required minLength={2} maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} aria-label="Video title" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-950" /><textarea maxLength={500} rows={2} value={description} onChange={(event) => setDescription(event.target.value)} aria-label="Description" placeholder="Description (optional)" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-950" /><div className="flex gap-2"><button className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white">Save</button><button type="button" onClick={() => { setTitle(video.title); setDescription(video.description); setEditing(false); }} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold dark:border-slate-700">Cancel</button></div></form>
        : <div><h3 className="font-bold">{video.title}</h3>{video.description && <p className="mt-1 text-sm text-slate-500">{video.description}</p>}</div>}
      <p className="flex flex-wrap items-center gap-2 text-xs text-slate-500"><span className={`rounded-full px-2 py-0.5 font-bold ${!ready ? 'bg-amber-100 text-amber-700' : video.published ? 'bg-teal-100 text-teal-700' : 'bg-slate-200 text-slate-600'}`}>{!ready ? 'Uploading' : video.published ? 'On website' : 'Hidden'}</span>{formatMegabytes(video.sizeBytes)}</p>
      <div className="flex flex-wrap gap-2">
        {ready && <button type="button" onClick={() => onPatch(video.id, { published: !video.published })} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold dark:border-slate-700">{video.published ? <><EyeOff className="h-3.5 w-3.5" />Hide from website</> : <><Eye className="h-3.5 w-3.5" />Show on website</>}</button>}
        {ready && !editing && <button type="button" onClick={() => setEditing(true)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold dark:border-slate-700">Edit title</button>}
        {(ready || !uploading) && <button type="button" onClick={() => { if (window.confirm(`Delete "${video.title}"? This cannot be undone.`)) onDelete(video.id); }} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-red-600"><Trash2 className="h-3.5 w-3.5" />Delete</button>}
      </div>
    </div>
  </article>;
}

function VideosAdmin() {
  const [videos, setVideos] = useState(null);
  const [picked, setPicked] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', published: true });
  const [progress, setProgress] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fileInput = useRef(null);
  const refresh = useCallback(() => api('/api/admin/videos').then((result) => setVideos(result.videos)).catch((loadError) => setError(loadError.message)), []);
  useEffect(() => { refresh(); }, [refresh]);

  function choose(next) {
    setPicked(next);
    setError('');
    setMessage('');
    setForm((current) => ({ ...current, title: current.title || titleFromFileName(next.name) }));
  }
  async function pick() {
    if (!hasNativeVideoUploader) { fileInput.current?.click(); return; }
    try {
      const result = await VideoUploader.pickVideo({ maxBytes: MAX_VIDEO_BYTES });
      choose({ native: result, name: result.name, sizeBytes: result.sizeBytes, needsCompression: result.needsCompression });
    } catch (pickError) {
      if (pickError.code !== 'CANCELLED') setError(pickError.message);
    }
  }
  async function submit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setProgress({ stage: 'uploading', percent: 0 });
    try {
      setVideos(await uploadVideo({
        picked: picked.native, file: picked.file, ...form,
        onProgress: (stage, percent) => setProgress({ stage, percent }),
      }));
      setMessage(form.published ? 'Video uploaded. It is now on the website.' : 'Video uploaded. It stays hidden until you show it on the website.');
      setPicked(null);
      setForm({ title: '', description: '', published: true });
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setProgress(null);
    }
  }
  async function patch(id, changes) {
    setError('');
    try { setVideos((await api(`/api/admin/videos/${id}`, { method: 'PATCH', body: JSON.stringify(changes) })).videos); return true; } catch (patchError) { setError(patchError.message); return false; }
  }
  async function remove(id) {
    setError('');
    try { setVideos((await api(`/api/admin/videos/${id}`, { method: 'DELETE' })).videos); } catch (deleteError) { setError(deleteError.message); }
  }

  const busy = Boolean(progress);
  return <div className="space-y-6">
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div><h2 className="flex items-center gap-2 font-extrabold"><Film className="h-5 w-5 text-teal-600" />Upload a video</h2><p className="mt-1 text-sm text-slate-500">{hasNativeVideoUploader ? 'Videos over 100 MB are compressed automatically on this phone before uploading.' : isNativeApp ? 'Videos must be under 100 MB. Update ABI Doctor to compress bigger videos automatically.' : 'Videos must be under 100 MB here. The ABI Doctor app compresses bigger videos automatically.'}</p></div>
      <input ref={fileInput} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; if (!file) return; if (file.size > MAX_VIDEO_BYTES) { setPicked(null); setMessage(''); setError(tooLargeMessage(file.size)); return; } choose({ file, name: file.name, sizeBytes: file.size, needsCompression: false }); }} />
      <button type="button" onClick={pick} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold disabled:opacity-60 dark:border-slate-700"><Upload className="h-4 w-4" />{picked ? 'Choose a different video' : 'Choose video'}</button>
      {picked && <>
        <p className="text-sm"><span className="font-semibold">{picked.name}</span> · {formatMegabytes(picked.sizeBytes)}{picked.needsCompression && hasNativeVideoUploader && <span className="text-teal-700 dark:text-teal-400"> · will be compressed to under 100 MB</span>}</p>
        <label className="block text-xs font-bold uppercase text-slate-500">Title<input required minLength={2} maxLength={120} value={form.title} disabled={busy} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm normal-case dark:border-slate-700 dark:bg-slate-950" /></label>
        <label className="block text-xs font-bold uppercase text-slate-500">Description (optional)<textarea maxLength={500} rows={2} value={form.description} disabled={busy} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm normal-case dark:border-slate-700 dark:bg-slate-950" /></label>
        <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={form.published} disabled={busy} onChange={(event) => setForm((current) => ({ ...current, published: event.target.checked }))} />Show on the clinic website</label>
        {progress ? <div><p className="mb-2 text-sm font-semibold">{VIDEO_STAGE_LABELS[progress.stage] || 'Uploading'}… {progress.percent}%</p><div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${progress.percent}%` }} /></div><p className="mt-2 text-xs text-slate-500">Keep ABI Doctor open until this finishes.</p></div>
          : <button className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-bold text-white"><Upload className="h-4 w-4" />Upload video</button>}
      </>}
      {message && <p className="rounded-xl bg-green-100 p-3 text-sm text-green-700">{message}</p>}
      {error && <p className="rounded-xl bg-red-100 p-3 text-sm text-red-700" role="alert">{error}</p>}
    </form>
    {videos === null ? <Loading /> : videos.length === 0 ? <Empty>No videos yet. Uploaded videos appear on the clinic website.</Empty>
      : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{videos.map((video) => <VideoCard key={video.id} video={video} uploading={busy} onPatch={patch} onDelete={remove} />)}</div>}
  </div>;
}

export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(null);
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState({ dashboard: null, appointments: [], schedule: { branches: [], hours: [], services: [] }, leaves: [], reviews: [] });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(navigator.onLine);
  const [lastSynced, setLastSynced] = useState(null);
  const knownAppointmentIds = useRef(null);
  // Once the phone is registered for ringing pushes, the ring is the alert; a second local
  // notification from the 30-second refresh would only repeat it.
  const ringingPush = useRef(false);
  // Whether the server knows to ring this phone: null while checking.
  const [ringRegistered, setRingRegistered] = useState(null);
  // The Videos tab stays mounted once opened, so switching tabs does not lose an upload in progress.
  const [videosOpened, setVideosOpened] = useState(false);

  const load = useCallback(async ({ silent = false, notify = true } = {}) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const [dashboard, appointments, schedule, leaves, reviews] = await Promise.all([api('/api/admin/dashboard'), api('/api/admin/appointments'), api('/api/admin/schedule'), api('/api/admin/leaves'), api('/api/admin/reviews')]);
      const nextAppointments = appointments.appointments;
      if (notify && knownAppointmentIds.current) {
        const newRequests = nextAppointments.filter((item) => item.status === 'requested' && !knownAppointmentIds.current.has(item.id));
        if (newRequests.length && !ringingPush.current) notifyNewAppointments(newRequests.length).catch(() => {});
      }
      knownAppointmentIds.current = new Set(nextAppointments.map((item) => item.id));
      if (hasSmsGateway) SmsGateway.processNow().catch(() => {});
      setData({ dashboard, appointments: nextAppointments, schedule, leaves: leaves.leaves, reviews: reviews.reviews });
      setAuthenticated(true);
      setConnected(true);
      setLastSynced(new Date());
    } catch (requestError) {
      if (requestError.status === 401) setAuthenticated(false); else setError(requestError.message);
    } finally { if (!silent) setLoading(false); }
  }, []);

  useEffect(() => {
    api('/api/admin/session')
      .then((session) => {
        setAuthenticated(Boolean(session.authenticated));
        if (session.authenticated) load();
      })
      .catch(() => setAuthenticated(false));
  }, [load]);
  useEffect(() => {
    if (!authenticated) return undefined;
    let stopMonitoring = () => {};
    let stopPushNotifications = () => {};
    // Opening the app (or tapping its Firebase alert) shows the list itself; a second local
    // "New appointment request" notification would only duplicate the alert just tapped.
    monitorNativeApp({
      onResume: () => load({ silent: true, notify: false }),
      onNetworkChange: setConnected,
    }).then((stop) => { stopMonitoring = stop; }).catch(() => {});
    if (isNativeApp) {
      enableAppointmentNotifications().catch(() => {});
      api('/api/admin/mobile-config').then((config) => {
        if (!config.pushNotifications) {
          setRingRegistered(false);
          return undefined;
        }
        return registerPushNotifications(
          (token) => api('/api/admin/device-tokens', {
            method: 'POST',
            body: JSON.stringify({ token, platform: 'android', alertStyle: hasAppointmentAlerts ? 'ring' : 'notification' }),
          }).then(() => {
            ringingPush.current = hasAppointmentAlerts;
            setRingRegistered(hasAppointmentAlerts);
          }, () => setRingRegistered(false)),
          () => load({ silent: true, notify: false }),
          { onReceive: () => load({ silent: true, notify: false }), onError: () => setRingRegistered(false) },
        );
      }).then((stop) => { if (stop) stopPushNotifications = stop; }).catch(() => setRingRegistered(false));
    }
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) load({ silent: true });
    }, 30_000);
    return () => { window.clearInterval(timer); stopMonitoring(); stopPushNotifications(); };
  }, [authenticated, load]);
  async function act(operation, success) { setError(''); setMessage(''); try { const result = await operation(); setMessage(typeof success === 'function' ? success(result) : success); await load({ silent: true }); return true; } catch (requestError) { setError(requestError.message); return false; } }
  async function logout() { try { await api('/api/admin/logout', { method: 'POST', body: '{}' }); setAuthenticated(false); } catch (requestError) { setError(requestError.message); } }
  async function copy(value) { setError(''); if (await copyText(value)) setMessage('Google review link copied.'); else setError('Could not copy. Long-press the link to copy it manually.'); }
  function notificationMessage(base, notifications = {}) {
    const parts = [base];
    const { sms, whatsapp } = notifications;
    if (sms?.queued) parts.push('SMS is on its way to the patient.');
    else if (sms?.error) parts.push(`Automatic SMS failed: ${sms.error}`);
    if (whatsapp?.sent) parts.push('WhatsApp sent to the patient.');
    else if (whatsapp?.error) parts.push(`Automatic WhatsApp failed: ${whatsapp.error}`);
    if (parts.length === 1 && !sms?.duplicate && !whatsapp?.duplicate) parts.push('Tap WhatsApp or SMS on the appointment to inform the patient.');
    return parts.filter(Boolean).join(' ');
  }
  function updateStatus(item, status) {
    return act(() => api(`/api/admin/appointments/${item.id}`, { method: 'PATCH', body: JSON.stringify({ status, adminNotes: item.admin_notes || '' }) }), (result) => notificationMessage('Appointment updated.', result.notifications));
  }
  function resend(item, channel) {
    return act(() => api(`/api/admin/appointments/${item.id}/notify`, { method: 'POST', body: JSON.stringify({ channel }) }), (result) => notificationMessage('', { [channel]: result.notification }));
  }
  async function registerSmsPhone(form) {
    await act(async () => {
      const result = await api('/api/admin/sms-sender', { method: 'POST', body: JSON.stringify(form) });
      await SmsGateway.configure({ apiBase: window.location.origin, secret: result.secret });
      return result;
    }, 'This phone is now the clinic SMS sender. Send a test SMS to check it.');
  }
  function notify(success, failure) { setMessage(success); setError(failure); }

  if (authenticated === null) return <main className="min-h-screen bg-slate-950 text-white"><Loading /></main>;
  if (!authenticated) return <Login onLogin={() => { setAuthenticated(true); load(); }} />;

  return <main className="min-h-screen bg-slate-50 pb-[env(safe-area-inset-bottom)] text-slate-900 dark:bg-slate-950 dark:text-slate-100"><header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/95"><div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3"><div><h1 className="text-lg font-extrabold sm:text-xl">ABI Doctor Dashboard</h1><p className={`flex items-center gap-1 text-xs ${connected ? 'text-teal-600' : 'text-red-500'}`}>{connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}{connected ? `Live${lastSynced ? ` · synced ${lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}` : 'Offline'}</p></div><div className="flex gap-2"><button onClick={() => load()} className="rounded-xl bg-slate-100 p-2.5 dark:bg-slate-900" aria-label="Refresh"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button><button onClick={logout} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-bold text-white dark:bg-white dark:text-slate-950"><LogOut className="h-4 w-4" /><span className="hidden sm:inline">Logout</span></button></div></div></header><div className="mx-auto max-w-7xl p-4 sm:p-6"><nav className="mb-6 flex gap-2 overflow-x-auto pb-3">{TABS.map(([id, label, Icon]) => <button key={id} onClick={() => { setTab(id); if (id === 'videos') setVideosOpened(true); }} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${tab === id ? 'bg-teal-600 text-white' : 'border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'}`}><Icon className="h-4 w-4" />{label}</button>)}</nav>{message && <p className="mb-5 rounded-xl bg-green-100 p-3 text-sm text-green-700">{message}</p>}{error && <p className="mb-5 rounded-xl bg-red-100 p-3 text-sm text-red-700" role="alert">{error}</p>}{loading && !data.dashboard ? <Loading /> : <>{tab === 'overview' && <Overview data={data.dashboard} ringRegistered={ringRegistered} />}{tab === 'appointments' && <Appointments appointments={data.appointments} autoWhatsApp={Boolean(data.dashboard?.patientWhatsApp)} smsSender={data.dashboard?.smsSender} onUpdate={updateStatus} onResend={resend} onCopy={copy} />}{tab === 'schedule' && <Schedule data={data.schedule} onSave={(branchId, periods) => act(() => api(`/api/admin/schedule/${branchId}`, { method: 'PUT', body: JSON.stringify({ periods }) }), 'Working schedule saved.')} onToggleService={(id, active) => act(() => api(`/api/admin/services/${id}`, { method: 'PATCH', body: JSON.stringify({ active }) }), 'Service availability updated.')} />}{tab === 'leaves' && <Leaves leaves={data.leaves} branches={data.schedule.branches} onCreate={(form) => act(() => api('/api/admin/leaves', { method: 'POST', body: JSON.stringify(form) }), 'Leave day added; public slots are updated.')} onDelete={(id) => act(() => api(`/api/admin/leaves/${id}`, { method: 'DELETE' }), 'Leave day removed.')} />}{tab === 'reviews' && <ReviewsAdmin reviews={data.reviews} branches={data.schedule.branches} onModerate={(id, status) => act(() => api(`/api/admin/reviews/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }), 'Review moderated.')} onDelete={(id) => act(() => api(`/api/admin/reviews/${id}`, { method: 'DELETE' }), 'Review deleted.')} />}{tab === 'sms' && <SmsPhone sender={data.dashboard?.smsSender} notify={notify} onRegister={registerSmsPhone} onRemove={() => act(() => api('/api/admin/sms-sender', { method: 'DELETE' }), 'Automatic SMS stopped. No phone is registered.')} onTest={(phone) => act(() => api('/api/admin/sms-sender/test', { method: 'POST', body: JSON.stringify({ phone }) }), 'Test SMS queued. It appears in Recent SMS when the phone sends it.')} onLimit={(dailyLimit) => act(() => api('/api/admin/sms-sender', { method: 'PATCH', body: JSON.stringify({ dailyLimit }) }), 'Daily SMS limit saved.')} />}{videosOpened && <div hidden={tab !== 'videos'}><VideosAdmin /></div>}{tab === 'clinics' && <Clinics branches={data.schedule.branches} onSaveReviewLink={(id, googleReviewUrl) => act(() => api(`/api/admin/branches/${id}`, { method: 'PATCH', body: JSON.stringify({ googleReviewUrl }) }), 'Google review link saved.')} />}</>}</div></main>;
}
