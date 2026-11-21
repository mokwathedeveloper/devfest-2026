/** Track name with its colour marker; the colour comes from tracks.json via useEvent(), never hard-coded. */
import { useEvent } from '../hooks/useEvent.jsx';

export default function TrackBadge({ track }) {
  const { trackColor } = useEvent();
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink">
      <span className="h-2.5 w-2.5 rotate-45" style={{ backgroundColor: trackColor(track) }} aria-hidden="true" />
      {track}
    </span>
  );
}
