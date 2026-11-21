/** Thin banner shown while event.isDemo is true, so sample data is never mistaken for real data. */
import { useEvent } from '../hooks/useEvent.jsx';

export default function DemoBanner() {
  const { event } = useEvent();
  if (!event?.isDemo) return null;
  return (
    <div className="bg-ink text-paper" role="note">
      <p className="container-page py-1.5 text-center text-xs tracking-wide">
        <span className="mr-2 rounded bg-g-yellow px-1.5 py-0.5 font-bold uppercase text-ink">Demo</span>
        {event.demoNotice || 'Demonstration data — all event details are placeholders.'}
      </p>
    </div>
  );
}
