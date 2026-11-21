import { Link } from 'react-router-dom';
import { AlertTriangle, CalendarHeart, Trash2 } from 'lucide-react';
import { api } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import { useMySchedule } from '../hooks/useMySchedule.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { findConflicts, formatDate, formatTime, sortSessions } from '../utils/time.js';
import PageHeader from '../components/PageHeader.jsx';
import SessionCard from '../components/SessionCard.jsx';
import { EmptyState, ErrorState, SkeletonGrid } from '../components/States.jsx';

export default function MySchedule() {
  useDocumentTitle('My Schedule');
  const { ids, remove, clear } = useMySchedule();
  const { data, loading, error, reload } = useFetch(() => Promise.all([api.getSessions(), api.getSpeakers()]), []);
  const [sessions = [], speakers = []] = data || [];

  const mine = sortSessions(sessions.filter((s) => ids.includes(s.id)));
  const staleCount = ids.length - mine.length; // saved IDs whose session no longer exists
  const conflicts = findConflicts(mine);
  const conflictIds = new Set(conflicts.flat().map((s) => s.id));
  const grouped = mine.reduce((acc, s) => { (acc[s.date] ||= []).push(s); return acc; }, {});

  return (
    <>
      <PageHeader title="My schedule" subtitle="Sessions you’ve saved. Stored only in this browser — no account needed.">
        {mine.length > 0 && <button className="btn-outline" onClick={() => window.confirm('Remove all saved sessions?') && clear()}><Trash2 className="h-4 w-4" />Clear all</button>}
      </PageHeader>
      <div className="container-page py-8">
        {loading ? <SkeletonGrid count={3} /> : error ? <ErrorState error={error} onRetry={reload} /> : (
          <>
            {conflicts.length > 0 && (
              <div className="mb-6 rounded-lg border border-g-red/40 bg-red-50 p-5" role="alert">
                <h2 className="flex items-center gap-2 font-semibold text-g-red"><AlertTriangle className="h-5 w-5" aria-hidden="true" />Schedule conflict{conflicts.length > 1 ? 's' : ''} detected</h2>
                <ul className="mt-2 space-y-1 text-sm text-ink">
                  {conflicts.map(([a, b]) => (
                    <li key={a.id + b.id}><strong>{a.title}</strong> ({formatTime(a.startTime)}–{formatTime(a.endTime)}) overlaps with <strong>{b.title}</strong> ({formatTime(b.startTime)}–{formatTime(b.endTime)}) on {formatDate(a.date, { weekday: 'short', month: 'short', day: 'numeric' })}.</li>
                  ))}
                </ul>
              </div>
            )}
            {staleCount > 0 && (
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-g-yellow/50 bg-yellow-50 p-4 text-sm">
                <span>{staleCount} saved session{staleCount > 1 ? 's are' : ' is'} no longer available (removed by organizers).</span>
                <button className="font-semibold text-ink hover:underline" onClick={() => ids.filter((id) => !sessions.some((s) => s.id === id)).forEach(remove)}>Remove them</button>
              </div>
            )}
            {mine.length === 0 ? (
              <EmptyState icon={CalendarHeart} title="Your schedule is empty" message="Browse the agenda and tap “Add” on any session to build your personal plan."
                action={<Link to="/schedule" className="btn-primary">Browse schedule</Link>} />
            ) : (
              <div className="space-y-10">
                {Object.entries(grouped).map(([date, list]) => (
                  <section key={date} aria-labelledby={`d-${date}`}>
                    <h2 id={`d-${date}`} className="mb-4 text-xl font-bold">{formatDate(date)}</h2>
                    <div className="grid gap-4">
                      {list.map((s) => <SessionCard key={s.id} session={s} onRemove={remove} conflict={conflictIds.has(s.id)} speakers={s.speakerIds.map((id) => speakers.find((x) => x.id === id)).filter(Boolean)} />)}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
