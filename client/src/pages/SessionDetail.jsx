import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Clock, MapPin, Tag, CalendarX } from 'lucide-react';
import { api } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useEvent } from '../hooks/useEvent.jsx';
import { formatDate, formatTime } from '../utils/time.js';
import Avatar from '../components/Avatar.jsx';
import TrackBadge from '../components/TrackBadge.jsx';
import AddToScheduleButton from '../components/AddToScheduleButton.jsx';
import { EmptyState, ErrorState, Loading } from '../components/States.jsx';

function Fact({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-5 w-5 text-ink" aria-hidden="true" />
      <div><dt className="text-xs font-semibold uppercase tracking-wide text-mute">{label}</dt><dd className="font-medium">{children}</dd></div>
    </div>
  );
}

export default function SessionDetail() {
  const { id } = useParams();
  const { event } = useEvent();
  const { data: s, loading, error, reload } = useFetch(() => api.getSession(id), [id]);
  useDocumentTitle(s?.title);

  if (loading) return <Loading label="Loading session…" />;
  if (error?.status === 404) return <div className="container-page py-16"><EmptyState icon={CalendarX} title="Session not found" message="This session doesn’t exist or may have been removed." action={<Link to="/schedule" className="btn-outline"><ArrowLeft className="h-4 w-4" />Back to schedule</Link>} /></div>;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const missing = s.speakerIds.length - s.speakers.length;
  return (
    <div className="container-page py-10">
      <Link to="/schedule" className="inline-flex items-center gap-1.5 text-sm font-medium text-mute hover:text-ink hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Back to schedule</Link>
      <div className="mt-4 grid gap-8 lg:grid-cols-[2fr_1fr]">
        <article className="card p-6 sm:p-10">
          <div className="flex flex-wrap gap-2"><TrackBadge track={s.track} /><span className="border border-line px-2 py-0.5 text-xs text-mute">{s.type}</span></div>
          <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">{s.title}</h1>
          <p className="mt-5 whitespace-pre-line leading-relaxed text-ink">{s.description}</p>
          <div className="mt-8"><AddToScheduleButton sessionId={s.id} /></div>
          <h2 className="mt-10 text-xl font-bold">{s.speakers.length === 1 ? 'Speaker' : 'Speakers'}</h2>
          {s.speakers.length === 0 && <p className="mt-2 text-mute">Speaker information is not available yet.</p>}
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {s.speakers.map((sp) => (
              <li key={sp.id}>
                <Link to={`/speakers/${sp.id}`} className="card card-hover flex items-center gap-4 p-4">
                  <Avatar name={sp.name} src={sp.photo} className="h-14 w-14" />
                  <div className="min-w-0"><p className="truncate font-semibold">{sp.name}</p><p className="truncate text-sm text-mute">{sp.title} · {sp.company}</p></div>
                </Link>
              </li>
            ))}
          </ul>
          {missing > 0 && <p className="mt-3 text-sm text-mute">{missing} speaker profile{missing > 1 ? 's' : ''} unavailable.</p>}
        </article>
        <aside className="card h-fit p-6">
          <h2 className="mb-4 text-lg font-bold">Session details</h2>
          <dl className="space-y-5">
            <Fact icon={CalendarDays} label="Date">{formatDate(s.date)}</Fact>
            <Fact icon={Clock} label="Time">{formatTime(s.startTime)} – {formatTime(s.endTime)}</Fact>
            <Fact icon={MapPin} label="Location">{s.room}{event && <span className="block text-sm font-normal text-mute">{event.venue.name}</span>}</Fact>
            <Fact icon={Tag} label="Track">{s.track}, {s.type.toLowerCase()}</Fact>
          </dl>
        </aside>
      </div>
    </div>
  );
}
