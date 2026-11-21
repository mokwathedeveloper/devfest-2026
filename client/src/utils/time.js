/**
 * Date/time helpers. Times are stored as "HH:MM" and dates as "YYYY-MM-DD" strings, which sort correctly as text,
 * so most of these only convert for display or compare minutes. Overlap logic here must match server/utils/validators.js.
 */
/** "09:30" → 570 (minutes since midnight). */
export const toMinutes = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

/** "13:30" → "1:30 PM". */
export function formatTime(t) {
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${suffix}`;
}
/** "2026-12-05" → "Saturday, December 5, 2026" in the visitor's locale. The T00:00:00 avoids UTC day-shift bugs. */
export function formatDate(d, opts = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) {
  return new Date(`${d}T00:00:00`).toLocaleDateString(undefined, opts);
}
/** "December 5–6, 2026" (collapses the month when both dates share it). */
export function formatDateRange(a, b) {
  if (!a) return '';
  if (a === b) return formatDate(a, { month: 'long', day: 'numeric', year: 'numeric' });
  const da = new Date(`${a}T00:00:00`), db = new Date(`${b}T00:00:00`);
  const sameMonth = da.getMonth() === db.getMonth() && da.getFullYear() === db.getFullYear();
  const m = da.toLocaleDateString(undefined, { month: 'long' });
  return sameMonth
    ? `${m} ${da.getDate()}–${db.getDate()}, ${da.getFullYear()}`
    : `${formatDate(a, { month: 'short', day: 'numeric' })} – ${formatDate(b, { month: 'short', day: 'numeric', year: 'numeric' })}`;
}
/** Chronological order (date, start time, then room for a stable result). Returns a new array. */
export const sortSessions = (list) =>
  [...list].sort((a, b) => `${a.date} ${a.startTime} ${a.room}`.localeCompare(`${b.date} ${b.startTime} ${b.room}`));

/** Do two different sessions overlap? Back-to-back sessions do not. Mirrors the server's `overlaps`. */
export const sessionsOverlap = (a, b) =>
  a.id !== b.id && a.date === b.date && toMinutes(a.startTime) < toMinutes(b.endTime) && toMinutes(b.startTime) < toMinutes(a.endTime);

/** Returns array of [a, b] pairs that overlap. */
export function findConflicts(sessions) {
  const sorted = sortSessions(sessions);
  const pairs = [];
  for (let i = 0; i < sorted.length; i++)
    for (let j = i + 1; j < sorted.length; j++) if (sessionsOverlap(sorted[i], sorted[j])) pairs.push([sorted[i], sorted[j]]);
  return pairs;
}
/** Buckets a start time for the schedule's "time of day" filter. */
export function timeOfDay(t) {
  const m = toMinutes(t);
  return m < 12 * 60 ? 'morning' : m < 17 * 60 ? 'afternoon' : 'evening';
}
/** "Priya Nair" → "PN" (used when a speaker has no photo). */
export const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
