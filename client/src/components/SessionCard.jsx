import { Link } from 'react-router-dom';
import { MapPin, Trash2 } from 'lucide-react';
import TrackBadge from './TrackBadge.jsx';
import AddToScheduleButton from './AddToScheduleButton.jsx';
import CalendarMenu from './CalendarMenu.jsx';
import { useEvent } from '../hooks/useEvent.jsx';
import { formatTime } from '../utils/time.js';

/** Agenda row, styled like a line in a printed programme. */
export default function SessionCard({ session, speakers = [], onRemove, conflict = false, showDate = false }) {
  const { trackColor } = useEvent();
  const names = speakers.length ? speakers.map((s) => s.name).join(' · ') : 'Speaker to be announced';
  return (
    <article className={`card card-hover relative grid gap-3 border-l-[6px] p-5 sm:grid-cols-[8.5rem_1fr_auto] sm:gap-6 ${conflict ? '!border-r-g-red !border-t-g-red !border-b-g-red' : ''}`} style={{ borderLeftColor: trackColor(session.track) }}>
      <div>
        <p className="font-display text-xl font-bold leading-none">{formatTime(session.startTime)}</p>
        <p className="mt-1 text-xs text-mute">until {formatTime(session.endTime)}</p>
        {showDate && <p className="mt-1 text-xs font-semibold text-mute">{new Date(`${session.date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <TrackBadge track={session.track} />
          <span className="text-xs text-mute">{session.type}</span>
        </div>
        <h3 className="mt-1.5 text-xl font-bold leading-snug">
          <Link to={`/sessions/${session.id}`} className="after:absolute after:inset-0 hover:underline hover:decoration-2 hover:underline-offset-4">{session.title}</Link>
        </h3>
        <p className="mt-1 text-sm font-medium">{names}</p>
        <p className="mt-2 line-clamp-2 text-sm text-mute">{session.description}</p>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-mute"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{session.room}</p>
      </div>
      <div className="relative z-10 sm:self-start">
        {onRemove ? (
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <CalendarMenu session={session} speakers={speakers} compact />
            <button onClick={() => onRemove(session.id)} className="btn-outline !py-1.5 !text-xs" aria-label={`Remove ${session.title} from my schedule`}><Trash2 className="h-3.5 w-3.5" aria-hidden="true" />Remove</button>
          </div>
        ) : <AddToScheduleButton sessionId={session.id} compact />}
      </div>
    </article>
  );
}
