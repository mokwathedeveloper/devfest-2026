import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import { useEvent } from '../hooks/useEvent.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { formatDateRange, sortSessions } from '../utils/time.js';
import SpeakerCard from '../components/SpeakerCard.jsx';
import SessionCard from '../components/SessionCard.jsx';
import ProgramGrid from '../components/ProgramGrid.jsx';
import { ErrorState, Loading, SkeletonGrid } from '../components/States.jsx';

export default function Home() {
  useDocumentTitle('');
  const { event, tracks, loading: evLoading, error: evError, reload } = useEvent();
  const data = useFetch(() => Promise.all([api.getSpeakers(), api.getSessions()]), []);
  const [speakers, sessions] = data.data || [[], []];

  if (evLoading) return <Loading label="Loading event…" />;
  if (evError || !event) return <ErrorState error={evError} onRetry={reload} />;

  const featuredSessions = sortSessions(sessions).filter((s) => s.type === 'Keynote' || s.type === 'Workshop').slice(0, 3);
  
  return (
    <>
      <section className="border-b border-line bg-white">
        <div className="container-page pb-14 pt-12 sm:pt-16">
          <h1 className="font-extrabold leading-[0.88] tracking-[-0.005em] text-[clamp(3.25rem,14vw,11.5rem)]" style={{ fontStretch: '82%' }}>
            <span aria-hidden="true" className="text-g-blue">&lt;</span>
            {event.name}
            <span aria-hidden="true" className="ml-[0.08em] text-g-red">/</span><span aria-hidden="true" className="text-g-green">&gt;</span>
          </h1>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-end">
            <div>
              <p className="max-w-xl font-display text-2xl font-semibold leading-snug sm:text-3xl">{event.tagline}</p>
              <p className="mt-4 max-w-[60ch] text-lg leading-relaxed text-mute">{event.description}</p>
            </div>
            <div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 border-l-4 border-g-yellow pl-5">
                <dt className="text-sm text-mute">When</dt><dd className="font-semibold">{formatDateRange(event.startDate, event.endDate)}</dd>
                <dt className="text-sm text-mute">Where</dt><dd className="font-semibold">{event.venue.name}, {event.venue.city}</dd>
              </dl>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/schedule" className="btn-primary !px-5 !py-3">See the full schedule</Link>
                <Link to="/speakers" className="btn-outline !px-5 !py-3">Meet the speakers</Link>
              </div>
            </div>
          </div>

          <div className="mt-14">
            {data.loading ? <div className="h-72 animate-pulse rounded-lg bg-cream" role="status" aria-label="Loading program" />
              : data.error ? <ErrorState error={data.error} onRetry={data.reload} />
              : <ProgramGrid sessions={sessions} speakers={speakers} />}
          </div>
        </div>
      </section>

      <div className="border-b border-line">
        <p className="container-page py-6 text-lg text-mute">
          Expecting about {event.expectedAttendees.toLocaleString()} people, {speakers.length} speakers and {sessions.length} sessions across {tracks.length} tracks.
        </p>
      </div>

      <section className="container-page pt-16">
        <div className="mb-8 flex items-baseline justify-between gap-4">
          <h2 className="text-3xl font-bold sm:text-4xl">Who’s on stage</h2>
          <Link to="/speakers" className="text-sm font-semibold underline underline-offset-4">All speakers →</Link>
        </div>
        {data.loading ? <SkeletonGrid count={3} /> : data.error ? <ErrorState error={data.error} onRetry={data.reload} /> : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {speakers.slice(0, 3).map((s) => <SpeakerCard key={s.id} speaker={s} sessions={sessions.filter((x) => x.speakerIds.includes(s.id))} />)}
          </div>
        )}
      </section>

      <section className="container-page pt-16">
        <div className="mb-8 flex items-baseline justify-between gap-4">
          <h2 className="text-3xl font-bold sm:text-4xl">Don’t miss these</h2>
          <Link to="/schedule" className="text-sm font-semibold underline underline-offset-4">Full schedule →</Link>
        </div>
        {!data.loading && !data.error && (
          <div className="grid gap-4">{featuredSessions.map((s) => <SessionCard key={s.id} session={s} showDate speakers={s.speakerIds.map((id) => speakers.find((x) => x.id === id)).filter(Boolean)} />)}</div>
        )}
      </section>
    </>
  );
}
