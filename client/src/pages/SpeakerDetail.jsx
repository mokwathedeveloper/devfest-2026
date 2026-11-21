/** One speaker's profile and their sessions. Shows a friendly message if the ID doesn't exist (404). */
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, UserX } from 'lucide-react';
import { api } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import Avatar from '../components/Avatar.jsx';
import SessionCard from '../components/SessionCard.jsx';
import { SocialLinks } from '../components/SpeakerCard.jsx';
import { EmptyState, ErrorState, Loading } from '../components/States.jsx';
import { sortSessions } from '../utils/time.js';

export default function SpeakerDetail() {
  const { id } = useParams();
  const { data: speaker, loading, error, reload } = useFetch(() => api.getSpeaker(id), [id]);
  useDocumentTitle(speaker?.name);

  const back = <Link to="/speakers" className="btn-outline"><ArrowLeft className="h-4 w-4" />All speakers</Link>;
  if (loading) return <Loading label="Loading speaker…" />;
  if (error?.status === 404) return <div className="container-page py-16"><EmptyState icon={UserX} title="Speaker not found" message="This speaker doesn’t exist or may have been removed." action={back} /></div>;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="container-page py-10">
      <Link to="/speakers" className="inline-flex items-center gap-1.5 text-sm font-medium text-mute hover:text-ink hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden="true" />All speakers</Link>
      <section className="card mt-4 flex flex-col gap-8 p-6 sm:p-10 md:flex-row">
        <Avatar name={speaker.name} src={speaker.photo} className="h-48 w-48 sm:h-60 sm:w-60" rounded="rounded-none" />
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">{speaker.name}</h1>
          <p className="mt-1 text-lg text-ink">{speaker.title}</p>
          <p className="text-mute">{speaker.company}</p>
          <p className="mt-5 max-w-2xl leading-relaxed text-ink">{speaker.bio}</p>
          <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-mute">Expertise</h2>
          <ul className="mt-2 flex flex-wrap gap-2">{speaker.expertise.map((x) => <li key={x} className="border border-ink px-2.5 py-0.5 text-sm">{x}</li>)}</ul>
          <div className="mt-6"><SocialLinks socials={speaker.socials} name={speaker.name} /></div>
        </div>
      </section>
      <section className="mt-10">
        <h2 className="text-2xl font-bold">Sessions by {speaker.name.split(' ')[0]}</h2>
        {speaker.sessions.length === 0 ? <p className="mt-4 text-mute">No sessions scheduled yet.</p> : (
          <div className="mt-4 grid gap-4">{sortSessions(speaker.sessions).map((s) => <SessionCard key={s.id} session={s} showDate speakers={[speaker]} />)}</div>
        )}
      </section>
    </div>
  );
}
