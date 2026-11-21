import { readJson, writeJson, withLock } from '../utils/jsonStore.js';
import { validateSession, overlaps } from '../utils/validators.js';
import { badRequest, notFound, conflict } from '../utils/errors.js';
import { nextId } from '../utils/ids.js';

const byTime = (a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`);

/** Cross-file checks: speakers/track exist, no room or speaker double-booking. */
async function checkReferences(value, sessions, ignoreId) {
  const [speakers, tracks, event] = await Promise.all([readJson('speakers'), readJson('tracks'), readJson('event')]);
  const errors = {};
  const missing = value.speakerIds.filter((id) => !speakers.some((s) => s.id === id));
  if (missing.length) errors.speakerIds = `Unknown speaker(s): ${missing.join(', ')}.`;
  if (!tracks.some((t) => t.name === value.track)) errors.track = `Unknown track "${value.track}".`;
  if (!event.rooms.includes(value.room)) errors.room = `Unknown room "${value.room}".`;
  if (!event.sessionTypes.includes(value.type)) errors.type = `Unknown session type "${value.type}".`;
  if (event.startDate && (value.date < event.startDate || value.date > event.endDate))
    errors.date = `Date must fall within the event (${event.startDate} to ${event.endDate}).`;
  if (Object.keys(errors).length) throw badRequest('Invalid session data.', errors);

  const others = sessions.filter((s) => s.id !== ignoreId && overlaps(s, value));
  const roomClash = others.find((s) => s.room === value.room);
  if (roomClash) throw conflict(`"${value.room}" is already booked ${roomClash.startTime}–${roomClash.endTime} by "${roomClash.title}".`);
  const speakerClash = others.find((s) => s.speakerIds.some((id) => value.speakerIds.includes(id)));
  if (speakerClash) throw conflict(`A selected speaker is already presenting "${speakerClash.title}" at an overlapping time.`);
}

export async function listSessions(_req, res, next) {
  try { res.json((await readJson('sessions')).sort(byTime)); } catch (e) { next(e); }
}

export async function getSession(req, res, next) {
  try {
    const session = (await readJson('sessions')).find((s) => s.id === req.params.id);
    if (!session) throw notFound(`Session "${req.params.id}" was not found.`);
    const speakers = await readJson('speakers');
    res.json({ ...session, speakers: session.speakerIds.map((id) => speakers.find((s) => s.id === id)).filter(Boolean) });
  } catch (e) { next(e); }
}

export async function createSession(req, res, next) {
  try {
    const { value, errors } = validateSession(req.body);
    if (errors) throw badRequest('Invalid session data.', errors);
    const created = await withLock(async () => {
      const sessions = await readJson('sessions');
      await checkReferences(value, sessions);
      const session = { id: nextId('session', sessions), ...value };
      sessions.push(session);
      await writeJson('sessions', sessions);
      return session;
    });
    res.status(201).json(created);
  } catch (e) { next(e); }
}

export async function updateSession(req, res, next) {
  try {
    const { value, errors } = validateSession(req.body);
    if (errors) throw badRequest('Invalid session data.', errors);
    const updated = await withLock(async () => {
      const sessions = await readJson('sessions');
      const i = sessions.findIndex((s) => s.id === req.params.id);
      if (i === -1) throw notFound(`Session "${req.params.id}" was not found.`);
      await checkReferences(value, sessions, req.params.id);
      sessions[i] = { id: sessions[i].id, ...value };
      await writeJson('sessions', sessions);
      return sessions[i];
    });
    res.json(updated);
  } catch (e) { next(e); }
}

export async function deleteSession(req, res, next) {
  try {
    await withLock(async () => {
      const sessions = await readJson('sessions');
      const i = sessions.findIndex((s) => s.id === req.params.id);
      if (i === -1) throw notFound(`Session "${req.params.id}" was not found.`);
      sessions.splice(i, 1);
      await writeJson('sessions', sessions);
    });
    res.status(204).end();
  } catch (e) { next(e); }
}
