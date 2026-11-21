/** Speaker directory with live search over name, organization, title and expertise. */
import { useMemo, useState } from 'react';
import { Search, UserX } from 'lucide-react';
import { api } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import PageHeader from '../components/PageHeader.jsx';
import SpeakerCard from '../components/SpeakerCard.jsx';
import { EmptyState, ErrorState, SkeletonGrid } from '../components/States.jsx';

export default function Speakers() {
  useDocumentTitle('Speakers');
  const [q, setQ] = useState('');
  const { data, loading, error, reload } = useFetch(() => Promise.all([api.getSpeakers(), api.getSessions()]), []);
  const [speakers = [], sessions = []] = data || [];

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return speakers;
    return speakers.filter((s) => [s.name, s.company, s.title, ...s.expertise].some((f) => f.toLowerCase().includes(term)));
  }, [q, speakers]);

  return (
    <>
      <PageHeader title="Speakers" subtitle="Meet the engineers, designers and community leaders sharing their knowledge at DevFest 2026.">
        <div className="relative w-full sm:w-80">
          <label htmlFor="speaker-search" className="sr-only">Search speakers</label>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" aria-hidden="true" />
          <input id="speaker-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, organization, expertise…" className="input !pl-10" />
        </div>
      </PageHeader>
      <div className="container-page py-10">
        {loading ? <SkeletonGrid /> : error ? <ErrorState error={error} onRetry={reload} /> : filtered.length === 0 ? (
          <EmptyState icon={UserX} title={q ? 'No speakers match your search' : 'No speakers yet'} message={q ? `Nothing matched “${q}”. Try a different name, organization or topic.` : 'Speakers will be announced soon.'}
            action={q && <button className="btn-outline" onClick={() => setQ('')}>Clear search</button>} />
        ) : (
          <>
            <p className="mb-4 text-sm text-mute" aria-live="polite">{filtered.length} speaker{filtered.length === 1 ? '' : 's'}</p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((s) => <SpeakerCard key={s.id} speaker={s} sessions={sessions.filter((x) => x.speakerIds.includes(s.id))} />)}
            </div>
          </>
        )}
      </div>
    </>
  );
}
