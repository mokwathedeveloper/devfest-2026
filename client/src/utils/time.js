export const toMinutes = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

export function formatTime(t) {
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${suffix}`;
}
export function formatDate(d, opts = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) {
  return new Date(`${d}T00:00:00`).toLocaleDateString(undefined, opts);
}
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
export const sortSessions = (list) =>
  [...list].sort((a, b) => `${a.date} ${a.startTime} ${a.room}`.localeCompare(`${b.date} ${b.startTime} ${b.room}`));

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
export function timeOfDay(t) {
  const m = toMinutes(t);
  return m < 12 * 60 ? 'morning' : m < 17 * 60 ? 'afternoon' : 'evening';
}
export const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
