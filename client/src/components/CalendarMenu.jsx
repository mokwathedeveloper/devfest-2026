import { useEffect, useRef, useState } from 'react';
import { CalendarPlus, ChevronDown } from 'lucide-react';
import { useEvent } from '../hooks/useEvent.jsx';
import { buildIcs, downloadIcs, getReminder, googleCalendarUrl } from '../utils/calendar.js';

/** "Add to calendar" dropdown for one session: Google Calendar link or an .ics file with a reminder alarm. */
export default function CalendarMenu({ session, speakers = [], compact = false }) {
  const { event } = useEvent();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (e.type === 'keydown' ? e.key === 'Escape' : !ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', close); };
  }, [open]);

  const item = 'block w-full px-4 py-2.5 text-left text-sm hover:bg-cream';
  return (
    <div className="relative inline-block" ref={ref}>
      <button type="button" className={`btn-outline ${compact ? '!py-1.5 !text-xs' : ''}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <CalendarPlus className="h-4 w-4" aria-hidden="true" />Add to calendar<ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-30 mt-1 w-64 overflow-hidden rounded-md border border-ink bg-white shadow-xl">
          <a role="menuitem" className={item} href={googleCalendarUrl(session, event, speakers)} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
            Google Calendar<span className="block text-xs text-mute">Opens in a new tab</span>
          </a>
          <button role="menuitem" type="button" className={`${item} border-t border-line`}
            onClick={() => { downloadIcs(`${session.id}.ics`, buildIcs([{ session, speakers }], event, getReminder())); setOpen(false); }}>
            Apple, Outlook or other (.ics)<span className="block text-xs text-mute">Includes a reminder alarm</span>
          </button>
        </div>
      )}
    </div>
  );
}
