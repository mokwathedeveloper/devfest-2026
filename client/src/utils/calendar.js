// Calendar helpers: Google Calendar links and standards-compliant .ics files (Apple, Outlook, Google import).
// Event times have no time zone in the data, so they are written as "floating" local times:
// a 9:00 session shows as 9:00 in whichever calendar the attendee opens it in.

const pad = (n) => String(n).padStart(2, '0');
const stamp = (date, time) => `${date.replaceAll('-', '')}T${time.replace(':', '')}00`;
const sessionUrl = (s) => `${window.location.origin}/sessions/${s.id}`;

function describe(session, speakers) {
  const who = speakers.map((x) => x.name).join(', ');
  return [session.description, who && `Speaker${speakers.length > 1 ? 's' : ''}: ${who}`, `Track: ${session.track}`, sessionUrl(session)].filter(Boolean).join('\n\n');
}
const where = (session, event) => [session.room, event?.venue?.name, event?.venue?.address, event?.venue?.city].filter(Boolean).join(', ');

export function googleCalendarUrl(session, event, speakers = []) {
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${session.title} (${event?.name || 'DevFest'})`,
    dates: `${stamp(session.date, session.startTime)}/${stamp(session.date, session.endTime)}`,
    details: describe(session, speakers),
    location: where(session, event),
  });
  return `https://calendar.google.com/calendar/render?${p}`;
}

const esc = (t = '') => String(t).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
/** RFC 5545: lines are limited to 75 octets; continuation lines start with a space. */
function fold(line) {
  const bytes = new TextEncoder();
  const out = [];
  let cur = '';
  for (const ch of line) {
    if (bytes.encode(cur + ch).length > (out.length ? 74 : 75)) { out.push(cur); cur = ch; } else cur += ch;
  }
  out.push(cur);
  return out.map((l, i) => (i ? ` ${l}` : l)).join('\r\n');
}

/** sessions: array of { session, speakers }. reminderMinutes: 0 for no alarm. */
export function buildIcs(items, event, reminderMinutes = 15) {
  const now = new Date();
  const dtstamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//DevFest 2026//Schedule//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', `X-WR-CALNAME:${esc(event?.name || 'DevFest')} – My schedule`];
  for (const { session: s, speakers = [] } of items) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${s.id}@devfest-2026`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${stamp(s.date, s.startTime)}`,
      `DTEND:${stamp(s.date, s.endTime)}`,
      `SUMMARY:${esc(s.title)}`,
      `DESCRIPTION:${esc(describe(s, speakers))}`,
      `LOCATION:${esc(where(s, event))}`,
      `URL:${sessionUrl(s)}`,
      `CATEGORIES:${esc(s.track)}`,
    );
    if (reminderMinutes > 0) lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(`Starting soon: ${s.title}`)}`, `TRIGGER:-PT${reminderMinutes}M`, 'END:VALARM');
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

export function downloadIcs(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/calendar;charset=utf-8' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const KEY = 'devfest2026.reminderMinutes';
export const REMINDER_OPTIONS = [[0, 'No reminder'], [10, '10 minutes before'], [15, '15 minutes before'], [30, '30 minutes before'], [60, '1 hour before'], [1440, '1 day before']];
/** The attendee's preferred reminder (minutes before start), remembered in localStorage. Defaults to 15. */
export function getReminder() {
  try { const v = Number(localStorage.getItem(KEY)); return REMINDER_OPTIONS.some(([m]) => m === v) && localStorage.getItem(KEY) !== null ? v : 15; } catch { return 15; }
}
export function setReminder(m) { try { localStorage.setItem(KEY, String(m)); } catch { /* ignore */ } }
