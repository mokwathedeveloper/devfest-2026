import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';
import { useEvent } from '../hooks/useEvent.jsx';
import { formatDateRange } from '../utils/time.js';

export default function Footer() {
  const { event } = useEvent();
  return (
    <footer className="mt-24 border-t-2 border-ink bg-cream">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2"><Logo className="h-8 w-8" /><span className="font-display text-xl font-bold">{event?.name || 'DevFest 2026'}</span></div>
          <p className="mt-3 max-w-xs text-sm text-mute">{event?.tagline}</p>
        </div>
        <nav aria-label="Footer" className="text-sm">
          <h2 className="eyebrow">Around the site</h2>
          <ul className="mt-3 space-y-1.5">
            <li><Link className="underline decoration-line underline-offset-4 hover:decoration-ink" to="/speakers">Speakers</Link></li>
            <li><Link className="underline decoration-line underline-offset-4 hover:decoration-ink" to="/schedule">Schedule</Link></li>
            <li><Link className="underline decoration-line underline-offset-4 hover:decoration-ink" to="/my-schedule">My schedule</Link></li>
            <li><Link className="underline decoration-line underline-offset-4 hover:decoration-ink" to="/admin">Organizer login</Link></li>
          </ul>
        </nav>
        <div className="text-sm">
          <h2 className="eyebrow">Where &amp; when</h2>
          {event && <p className="mt-3 leading-relaxed">{event.venue.name}<br />{event.venue.address && <>{event.venue.address}<br /></>}{event.venue.city}<br /><span className="text-mute">{formatDateRange(event.startDate, event.endDate)}</span></p>}
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-mute">Demonstration app with placeholder data. Not affiliated with Google.</div>
    </footer>
  );
}
