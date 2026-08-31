import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2, ClipboardList, Clock3, Copy, LayoutDashboard,
  LoaderCircle, LogOut, MessageSquareQuote, Palmtree, RefreshCw, Save, ShieldCheck, Trash2, XCircle,
} from 'lucide-react';
import { api, formatTime, getLocalDateString } from '../lib/api';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const STATUSES = ['requested', 'confirmed', 'completed', 'cancelled', 'no_show'];
const TABS = [
  ['overview', 'Overview', LayoutDashboard],
  ['appointments', 'Appointments', ClipboardList],
  ['schedule', 'Working days', Clock3],
  ['leaves', 'Leave days', Palmtree],
  ['reviews', 'Reviews', MessageSquareQuote],
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
        <a href="/" className="mt-5 block text-center text-xs text-slate-500 hover:text-white">Return to clinic website</a>
      </form>
    </main>
  );
}

function Overview({ data }) {
  const stats = data?.stats || {};
  const cards = [['Today', stats.today], ['New requests', stats.requested], ['Upcoming confirmed', stats.upcomingConfirmed], ['Completed', stats.completed], ['Reviews pending', stats.pendingReviews]];
  return <div className="space-y-8"><div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4">{cards.map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5"><p className="text-xs font-bold uppercase text-slate-500">{label}</p><p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">{value || 0}</p></div>)}</div><div><h2 className="text-xl font-bold mb-4">Latest appointment requests</h2>{data?.recentAppointments?.length ? <div className="space-y-3">{data.recentAppointments.map((item) => <div key={item.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-wrap justify-between gap-3"><div><strong>{item.patient_name}</strong><p className="text-xs text-slate-500">{item.reference} · {item.service_name}</p></div><div className="text-right text-sm"><p>{item.appointment_date} · {formatTime(item.time_slot)}</p><span className={`inline-block mt-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase ${statusClass(item.status)}`}>{item.status}</span></div></div>)}</div> : <Empty>No appointments yet.</Empty>}</div></div>;
}

function Appointments({ appointments, onUpdate }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const filtered = appointments.filter((item) => (filter === 'all' || item.status === filter) && [item.patient_name, item.reference, item.phone].some((value) => String(value).toLowerCase().includes(search.toLowerCase())));
  return <div><div className="mb-5 flex flex-col sm:flex-row gap-3"><input placeholder="Search patient, phone or reference" value={search} onChange={(event) => setSearch(event.target.value)} className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3" /><select value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3"><option value="all">All statuses</option>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select></div>{filtered.length ? <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800"><table className="w-full min-w-[900px] text-sm"><thead className="bg-slate-100 dark:bg-slate-900 text-left text-xs uppercase text-slate-500"><tr><th className="p-4">Patient</th><th className="p-4">Appointment</th><th className="p-4">Treatment</th><th className="p-4">Status</th><th className="p-4">Contact / review</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id} className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 align-top"><td className="p-4"><strong>{item.patient_name}</strong><p className="text-xs text-slate-500">{item.reference}</p>{item.notes && <p className="mt-2 max-w-xs text-xs text-slate-500">{item.notes}</p>}</td><td className="p-4">{item.appointment_date}<br />{formatTime(item.time_slot)}<p className="text-xs text-slate-500">{item.branch_name}</p></td><td className="p-4">{item.service_name}</td><td className="p-4"><select value={item.status} onChange={(event) => onUpdate(item, event.target.value)} className={`rounded-lg px-3 py-2 text-xs font-bold ${statusClass(item.status)}`}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select></td><td className="p-4"><a href={`tel:+91${item.phone}`} className="text-teal-600 font-semibold">+91 {item.phone}</a>{item.review_url && <button type="button" onClick={() => navigator.clipboard.writeText(item.review_url)} className="mt-3 flex items-center gap-1 text-xs text-slate-500 hover:text-teal-600"><Copy className="w-3 h-3" />Copy verified review invite</button>}</td></tr>)}</tbody></table></div> : <Empty>No matching appointments.</Empty>}</div>;
}

function Schedule({ data, onSave, onToggleService }) {
  const [branchId, setBranchId] = useState(data.branches?.[0]?.id || '');
  const source = useMemo(() => data.hours.filter((hour) => hour.branch_id === branchId), [data.hours, branchId]);
  const [days, setDays] = useState([]);
  useEffect(() => {
    setDays(DAYS.map((name, dayOfWeek) => ({ name, dayOfWeek, periods: source.filter((hour) => hour.day_of_week === dayOfWeek).map((hour) => ({ startTime: hour.start_time, endTime: hour.end_time, slotMinutes: hour.slot_minutes })) })));
  }, [source]);
  function updatePeriod(dayIndex, periodIndex, key, value) {
    setDays((current) => current.map((day, index) => index !== dayIndex ? day : { ...day, periods: day.periods.map((period, pIndex) => pIndex !== periodIndex ? period : { ...period, [key]: key === 'slotMinutes' ? Number(value) : value }) }));
  }
  function toggleDay(dayIndex) {
    setDays((current) => current.map((day, index) => index !== dayIndex ? day : { ...day, periods: day.periods.length ? [] : [{ startTime: '09:00', endTime: '13:00', slotMinutes: 30 }] }));
  }
  function addPeriod(dayIndex) {
    setDays((current) => current.map((day, index) => index !== dayIndex || day.periods.length >= 3 ? day : { ...day, periods: [...day.periods, { startTime: '16:00', endTime: '20:00', slotMinutes: 30 }] }));
  }
  return <div className="space-y-8"><div className="flex flex-wrap gap-3 items-center"><select value={branchId} onChange={(event) => setBranchId(event.target.value)} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">{data.branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select><button onClick={() => onSave(branchId, days.flatMap((day) => day.periods.map((period) => ({ ...period, dayOfWeek: day.dayOfWeek }))))} className="inline-flex items-center gap-2 bg-teal-600 text-white rounded-xl px-5 py-3 font-bold text-sm"><Save className="w-4 h-4" />Save schedule</button></div><div className="space-y-3">{days.map((day, dayIndex) => <div key={day.name} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"><div className="flex items-center justify-between gap-3"><label className="flex items-center gap-3 font-bold"><input type="checkbox" checked={day.periods.length > 0} onChange={() => toggleDay(dayIndex)} />{day.name}</label>{day.periods.length > 0 && day.periods.length < 3 && <button onClick={() => addPeriod(dayIndex)} className="text-xs text-teal-600 font-bold">+ Add period</button>}</div>{day.periods.length === 0 ? <p className="mt-2 text-xs text-slate-500">Closed</p> : <div className="mt-3 space-y-2">{day.periods.map((period, periodIndex) => <div key={`${day.name}-${periodIndex}`} className="flex flex-wrap items-center gap-2"><input aria-label={`${day.name} start`} type="time" value={period.startTime} onChange={(event) => updatePeriod(dayIndex, periodIndex, 'startTime', event.target.value)} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2" /><span>to</span><input aria-label={`${day.name} end`} type="time" value={period.endTime} onChange={(event) => updatePeriod(dayIndex, periodIndex, 'endTime', event.target.value)} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2" /><select aria-label={`${day.name} slot duration`} value={period.slotMinutes} onChange={(event) => updatePeriod(dayIndex, periodIndex, 'slotMinutes', event.target.value)} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2"><option value="15">15 min</option><option value="20">20 min</option><option value="30">30 min</option><option value="45">45 min</option><option value="60">60 min</option></select><button aria-label="Remove period" onClick={() => setDays((current) => current.map((currentDay, index) => index !== dayIndex ? currentDay : { ...currentDay, periods: currentDay.periods.filter((_, pIndex) => pIndex !== periodIndex) }))} className="p-2 text-red-500"><Trash2 className="w-4 h-4" /></button></div>)}</div>}</div>)}</div><div><h3 className="font-bold mb-3">Bookable services</h3><div className="grid sm:grid-cols-2 gap-2">{data.services.map((service) => <label key={service.id} className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-sm"><input type="checkbox" checked={Boolean(service.active)} onChange={(event) => onToggleService(service.id, event.target.checked)} />{service.name}</label>)}</div></div></div>;
}

function Leaves({ leaves, branches, onCreate, onDelete }) {
  const [form, setForm] = useState({ date: getLocalDateString(), branchId: '', reason: 'Doctor unavailable' });
  return <div className="space-y-6"><form onSubmit={(event) => { event.preventDefault(); onCreate(form); }} className="grid md:grid-cols-4 gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5"><input required type="date" min={getLocalDateString()} value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3" /><select value={form.branchId} onChange={(event) => setForm((current) => ({ ...current, branchId: event.target.value }))} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3"><option value="">All branches</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select><input required minLength="2" maxLength="200" value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3" /><button className="rounded-xl bg-teal-600 text-white font-bold">Add leave day</button></form>{leaves.length ? <div className="space-y-3">{leaves.map((leave) => <div key={leave.id} className="flex justify-between gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"><div><strong>{leave.leave_date}</strong><p className="text-xs text-slate-500">{leave.branch_name || 'All branches'} · {leave.reason}</p></div><button onClick={() => onDelete(leave.id)} className="text-red-500"><Trash2 className="w-5 h-5" /></button></div>)}</div> : <Empty>No leave days configured.</Empty>}</div>;
}

function ReviewsAdmin({ reviews, onModerate, onDelete }) {
  return reviews.length ? <div className="grid lg:grid-cols-2 gap-4">{reviews.map((review) => <article key={review.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5"><div className="flex justify-between gap-3"><div><strong>{review.patient_name}</strong><p className="text-xs text-slate-500">{review.reference} · {review.rating}/5</p></div><span className={`h-fit px-2 py-1 rounded-full text-[10px] font-bold uppercase ${statusClass(review.status)}`}>{review.status}</span></div><p className="my-4 text-sm text-slate-600 dark:text-slate-300">“{review.comment}”</p><div className="flex gap-2"><button onClick={() => onModerate(review.id, 'approved')} className="inline-flex items-center gap-1 rounded-lg bg-green-100 text-green-700 px-3 py-2 text-xs font-bold"><CheckCircle2 className="w-4 h-4" />Approve</button><button onClick={() => onModerate(review.id, 'rejected')} className="inline-flex items-center gap-1 rounded-lg bg-red-100 text-red-700 px-3 py-2 text-xs font-bold"><XCircle className="w-4 h-4" />Reject</button><button onClick={() => onDelete(review.id)} className="ml-auto text-red-500"><Trash2 className="w-4 h-4" /></button></div></article>)}</div> : <Empty>No submitted reviews.</Empty>;
}

export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(null);
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState({ dashboard: null, appointments: [], schedule: { branches: [], hours: [], services: [] }, leaves: [], reviews: [] });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [dashboard, appointments, schedule, leaves, reviews] = await Promise.all([api('/api/admin/dashboard'), api('/api/admin/appointments'), api('/api/admin/schedule'), api('/api/admin/leaves'), api('/api/admin/reviews')]);
      setData({ dashboard, appointments: appointments.appointments, schedule, leaves: leaves.leaves, reviews: reviews.reviews });
      setAuthenticated(true);
    } catch (requestError) {
      if (requestError.status === 401) setAuthenticated(false); else setError(requestError.message);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    api('/api/admin/session')
      .then((session) => {
        setAuthenticated(Boolean(session.authenticated));
        if (session.authenticated) load();
      })
      .catch(() => setAuthenticated(false));
  }, [load]);
  async function act(operation, success) { setError(''); setMessage(''); try { await operation(); setMessage(success); await load(); } catch (requestError) { setError(requestError.message); } }
  async function logout() { await api('/api/admin/logout', { method: 'POST', body: '{}' }); setAuthenticated(false); }

  if (authenticated === null) return <main className="min-h-screen bg-slate-950 text-white"><Loading /></main>;
  if (!authenticated) return <Login onLogin={() => { setAuthenticated(true); load(); }} />;

  return <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"><header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur"><div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4"><div><h1 className="text-xl font-extrabold">ABI Doctor Dashboard</h1><p className="text-xs text-slate-500">Live clinic operations</p></div><div className="flex gap-2"><button onClick={load} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900" aria-label="Refresh"><RefreshCw className="w-4 h-4" /></button><button onClick={logout} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 px-4 py-2 text-sm font-bold"><LogOut className="w-4 h-4" />Logout</button></div></div></header><div className="max-w-7xl mx-auto p-4 sm:p-6"><nav className="flex gap-2 overflow-x-auto pb-3 mb-6">{TABS.map(([id, label, Icon]) => <button key={id} onClick={() => setTab(id)} className={`shrink-0 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${tab === id ? 'bg-teal-600 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'}`}><Icon className="w-4 h-4" />{label}</button>)}</nav>{message && <p className="mb-5 rounded-xl bg-green-100 text-green-700 p-3 text-sm">{message}</p>}{error && <p className="mb-5 rounded-xl bg-red-100 text-red-700 p-3 text-sm" role="alert">{error}</p>}{loading && !data.dashboard ? <Loading /> : <>{tab === 'overview' && <Overview data={data.dashboard} />}{tab === 'appointments' && <Appointments appointments={data.appointments} onUpdate={(item, status) => act(() => api(`/api/admin/appointments/${item.id}`, { method: 'PATCH', body: JSON.stringify({ status, adminNotes: item.admin_notes || '' }) }), 'Appointment updated.')} />}{tab === 'schedule' && <Schedule data={data.schedule} onSave={(branchId, periods) => act(() => api(`/api/admin/schedule/${branchId}`, { method: 'PUT', body: JSON.stringify({ periods }) }), 'Working schedule saved.')} onToggleService={(id, active) => act(() => api(`/api/admin/services/${id}`, { method: 'PATCH', body: JSON.stringify({ active }) }), 'Service availability updated.')} />}{tab === 'leaves' && <Leaves leaves={data.leaves} branches={data.schedule.branches} onCreate={(form) => act(() => api('/api/admin/leaves', { method: 'POST', body: JSON.stringify(form) }), 'Leave day added; public slots are updated.')} onDelete={(id) => act(() => api(`/api/admin/leaves/${id}`, { method: 'DELETE' }), 'Leave day removed.')} />}{tab === 'reviews' && <ReviewsAdmin reviews={data.reviews} onModerate={(id, status) => act(() => api(`/api/admin/reviews/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }), 'Review moderated.')} onDelete={(id) => act(() => api(`/api/admin/reviews/${id}`, { method: 'DELETE' }), 'Review deleted.')} />}</>}</div></main>;
}
