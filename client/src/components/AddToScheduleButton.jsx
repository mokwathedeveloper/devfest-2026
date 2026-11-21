/** Save / unsave a session in "My schedule" (stored in the browser by useMySchedule). */
import { Plus, Check } from 'lucide-react';
import { useMySchedule } from '../hooks/useMySchedule.jsx';

export default function AddToScheduleButton({ sessionId, compact = false }) {
  const { has, toggle } = useMySchedule();
  const saved = has(sessionId);
  const Icon = saved ? Check : Plus;
  return (
    <button type="button" onClick={() => toggle(sessionId)} aria-pressed={saved}
      className={`${saved ? 'btn bg-g-green/15 text-ink !border-g-green' : 'btn-primary'} ${compact ? '!py-1.5 !text-xs' : ''}`}>
      <Icon className="h-4 w-4" aria-hidden="true" />
      {saved ? (compact ? 'Saved' : 'Saved') : compact ? 'Save' : 'Add to my schedule'}
    </button>
  );
}
