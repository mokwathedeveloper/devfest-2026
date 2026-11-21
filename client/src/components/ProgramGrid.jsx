import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useEvent } from '../hooks/useEvent.jsx';
import { formatDate, formatTime, toMinutes } from '../utils/time.js';

/** Vertical scale: pixels per minute. A session's block height and top offset are simply minutes × this. */
const PX_PER_MIN = 1.3;

/**
 * The programme at a glance: rooms across, time down, one coloured block per session.
 * Built entirely from API data. Wide screens get the grid; phones get a simple list (rooms don't fit side by side).
 */
export default function ProgramGrid({ sessions, speakers }) {
  const { event, trackColor } = useEvent();
  const days = useMemo(() => [...new Set(sessions.map((s) => s.date))].sort(), [sessions]);
  const [day, setDay] = useState(null);
  const current = days.includes(day) ? day : days[0];
  const list = useMemo(() => sessions.filter((s) => s.date === current), [sessions, current]);
  if (!days.length) return null;

  const rooms = event.rooms;
  // Visible time window: from the earliest start to the latest end of the selected day, rounded out to whole hours.
  const first = Math.floor(Math.min(...list.map((s) => toMinutes(s.startTime))) / 60) * 60;
  const last = Math.ceil(Math.max(...list.map((s) => toMinutes(s.endTime))) / 60) * 60;
  const height = (last - first) * PX_PER_MIN;
  const hours = Array.from({ length: (last - first) / 60 + 1 }, (_, i) => first + i * 60);
  const names = (s) => s.speakerIds.map((id) => speakers.find((x) => x.id === id)?.name).filter(Boolean).join(', ');
  const lines = `repeating-linear-gradient(to bottom, #D5DEEB 0 1px, transparent 1px ${60 * PX_PER_MIN}px)`;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-2xl font-bold sm:text-3xl">The program at a glance</h2>
        <div role="tablist" aria-label="Choose a day" className="flex gap-2">
          {days.map((d, i) => (
            <button key={d} role="tab" aria-selected={d === current} onClick={() => setDay(d)}
              className={`rounded-md border-2 border-ink px-4 py-1.5 text-sm font-semibold transition ${d === current ? 'bg-ink text-white' : 'bg-white hover:bg-cream'}`}>
              Day {i + 1}<span className="ml-2 font-normal opacity-70">{formatDate(d, { month: 'short', day: 'numeric' })}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Wide screens: rooms × time grid */}
      <div key={current} className="hidden overflow-hidden rounded-lg border border-line bg-white md:block" role="tabpanel">
        <div className="grid border-b border-line bg-cream/60" style={{ gridTemplateColumns: `4.5rem repeat(${rooms.length}, minmax(0, 1fr))` }}>
          <div />
          {rooms.map((r) => <div key={r} className="border-l border-line px-3 py-2 text-sm font-semibold">{r}</div>)}
        </div>
        <div className="grid" style={{ gridTemplateColumns: `4.5rem repeat(${rooms.length}, minmax(0, 1fr))` }}>
          <div className="relative" style={{ height }} aria-hidden="true">
            {hours.slice(0, -1).map((m) => (
              <span key={m} className="absolute right-2 -translate-y-1/2 whitespace-nowrap text-xs tabular-nums text-mute" style={{ top: (m - first) * PX_PER_MIN + 10 }}>{formatTime(`${String(m / 60).padStart(2, '0')}:00`)}</span>
            ))}
          </div>
          {rooms.map((room) => (
            <div key={room} className="relative border-l border-line" style={{ height, backgroundImage: lines }}>
              {list.filter((s) => s.room === room).map((s, i) => {
                const c = trackColor(s.track);
                return (
                  <Link key={s.id} to={`/sessions/${s.id}`} className="block-in absolute inset-x-1 overflow-hidden rounded border-l-4 px-2.5 py-1.5 text-left transition hover:z-10 hover:shadow-[3px_3px_0_0_#0F1B2D]"
                    style={{ top: (toMinutes(s.startTime) - first) * PX_PER_MIN + 2, height: (toMinutes(s.endTime) - toMinutes(s.startTime)) * PX_PER_MIN - 4, backgroundColor: `${c}22`, borderLeftColor: c, animationDelay: `${i * 70 + rooms.indexOf(room) * 90}ms` }}
                    aria-label={`${s.title}, ${formatTime(s.startTime)} to ${formatTime(s.endTime)}, ${room}`}>
                    <span className="block truncate text-[13px] font-semibold leading-tight">{s.title}</span>
                    <span className="mt-0.5 block truncate text-xs text-mute">{formatTime(s.startTime)} – {formatTime(s.endTime)}{names(s) && `, ${names(s)}`}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Phones: simple list */}
      <ul className="space-y-2 md:hidden">
        {list.map((s) => (
          <li key={s.id}>
            <Link to={`/sessions/${s.id}`} className="block rounded-md border border-line border-l-4 bg-white px-3 py-2.5" style={{ borderLeftColor: trackColor(s.track) }}>
              <span className="block text-sm font-semibold leading-snug">{s.title}</span>
              <span className="block text-xs text-mute">{formatTime(s.startTime)} – {formatTime(s.endTime)}, {s.room}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
