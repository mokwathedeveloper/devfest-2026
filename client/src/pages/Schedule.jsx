/** Full agenda grouped by day, with filters (day, time of day, speaker, track, room) applied in the browser. */
import { useMemo, useState } from 'react';
import { CalendarX, FilterX } from 'lucide-react';
import { api } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import { useEvent } from '../hooks/useEvent.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { formatDate, sortSessions, timeOfDay } from '../utils/time.js';
import PageHeader from '../components/PageHeader.jsx';
import SessionCard from '../components/SessionCard.jsx';
import { EmptyState, ErrorState, SkeletonGrid } from '../components/States.jsx';

const initial = { day: '', time: '', speaker: '', track: '', room: '' };

function Select({ id, label, value, onChange, options }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="input">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}

export default function Schedule() {
  useDocumentTitle('Schedule');
  const { tracks, event, trackColor } = useEvent();
  const [f, setF] = useState(initial);
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));
  const { data, loading, error, reload } = useFetch(() => Promise.all([api.getSessions(), api.getSpeakers()]), []);
  const [sessions = [], speakers = []] = data || [];

  const speakerOf = (s) => s.speakerIds.map((id) => speakers.find((x) => x.id === id)).filter(Boolean);
  const days = [...new Set(sessions.map((s) => s.date))].sort();
  const rooms = event?.rooms || [...new Set(sessions.map((s) => s.room))];

  // Filtering happens in the browser: the whole agenda is small, so one request and instant filter changes.
  const filtered = useMemo(() => sortSessions(sessions).filter((s) =>
    (!f.day || s.date === f.day) && (!f.time || timeOfDay(s.startTime) === f.time) &&
    (!f.speaker || s.speakerIds.includes(f.speaker)) && (!f.track || s.track === f.track) && (!f.room || s.room === f.room),
  ), [sessions, f]);

  const grouped = filtered.reduce((acc, s) => { (acc[s.date] ||= []).push(s); return acc; }, {});
  const active = Object.values(f).some(Boolean);

  return (
    <>
      <PageHeader title="Event schedule" subtitle="Browse every session in chronological order. Filter by day, time, speaker, track or room, then save your favourites." />
      <div className="container-page py-8">
        <form className="card grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-5" aria-label="Filter sessions" onSubmit={(e) => e.preventDefault()}>
          <Select id="f-day" label="Day" value={f.day} onChange={set('day')} options={[['', 'All days'], ...days.map((d) => [d, formatDate(d, { weekday: 'short', month: 'short', day: 'numeric' })])]} />
          <Select id="f-time" label="Time of day" value={f.time} onChange={set('time')} options={[['', 'Any time'], ['morning', 'Morning (before 12:00)'], ['afternoon', 'Afternoon (12:00–17:00)'], ['evening', 'Evening (after 17:00)']]} />
          <Select id="f-speaker" label="Speaker" value={f.speaker} onChange={set('speaker')} options={[['', 'All speakers'], ...speakers.map((s) => [s.id, s.name])]} />
          <Select id="f-track" label="Track" value={f.track} onChange={set('track')} options={[['', 'All tracks'], ...tracks.map((t) => [t.name, t.name])]} />
          <Select id="f-room" label="Room" value={f.room} onChange={set('room')} options={[['', 'All rooms'], ...rooms.map((r) => [r, r])]} />
        </form>

        <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-mute" aria-label="Track colour legend">
          {tracks.map((t) => <li key={t.id} className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: trackColor(t.name) }} aria-hidden="true" />{t.name}</li>)}
        </ul>

        <div className="mt-8">
          {loading ? <SkeletonGrid count={3} /> : error ? <ErrorState error={error} onRetry={reload} /> : filtered.length === 0 ? (
            <EmptyState icon={CalendarX} title={active ? 'No sessions match your filters' : 'No sessions scheduled yet'} message={active ? 'Try removing a filter to see more sessions.' : 'The agenda will be published soon.'}
              action={active && <button className="btn-outline" onClick={() => setF(initial)}><FilterX className="h-4 w-4" />Clear filters</button>} />
          ) : (
            <div className="space-y-10">
              <p className="text-sm text-mute" aria-live="polite">{filtered.length} session{filtered.length === 1 ? '' : 's'}{active && ' (filtered)'}</p>
              {Object.entries(grouped).map(([date, list]) => (
                <section key={date} aria-labelledby={`day-${date}`}>
                  <h2 id={`day-${date}`} className="mb-4 text-xl font-bold">{formatDate(date)}</h2>
                  <div className="grid gap-4">{list.map((s) => <SessionCard key={s.id} session={s} speakers={speakerOf(s)} />)}</div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
