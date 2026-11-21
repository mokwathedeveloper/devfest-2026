/**
 * Speaker CRUD. Pattern used by all write handlers:
 *   1. validate the request body (400 with per-field messages)
 *   2. inside withLock(): read the file, apply the change, write it back (so concurrent requests can't interleave)
 *   3. respond with the saved record
 * Deleting a speaker who is still assigned to a session is refused (409) so sessions never point at nobody.
 */
import { readJson, writeJson, withLock } from '../utils/jsonStore.js';
import { validateSpeaker } from '../utils/validators.js';
import { badRequest, notFound, conflict } from '../utils/errors.js';
import { nextId } from '../utils/ids.js';
import { removeUpload } from './uploadController.js';

export async function listSpeakers(_req, res, next) {
  try { res.json(await readJson('speakers')); } catch (e) { next(e); }
}

export async function getSpeaker(req, res, next) {
  try {
    const speakers = await readJson('speakers');
    const speaker = speakers.find((s) => s.id === req.params.id);
    if (!speaker) throw notFound(`Speaker "${req.params.id}" was not found.`);
    const sessions = (await readJson('sessions')).filter((s) => s.speakerIds.includes(speaker.id));
    res.json({ ...speaker, sessions });
  } catch (e) { next(e); }
}

export async function createSpeaker(req, res, next) {
  try {
    const { value, errors } = validateSpeaker(req.body);
    if (errors) throw badRequest('Invalid speaker data.', errors);
    const created = await withLock(async () => {
      const speakers = await readJson('speakers');
      const speaker = { id: nextId('speaker', speakers), ...value };
      speakers.push(speaker);
      await writeJson('speakers', speakers);
      return speaker;
    });
    res.status(201).json(created);
  } catch (e) { next(e); }
}

export async function updateSpeaker(req, res, next) {
  try {
    const { value, errors } = validateSpeaker(req.body);
    if (errors) throw badRequest('Invalid speaker data.', errors);
    const updated = await withLock(async () => {
      const speakers = await readJson('speakers');
      const i = speakers.findIndex((s) => s.id === req.params.id);
      if (i === -1) throw notFound(`Speaker "${req.params.id}" was not found.`);
      const oldPhoto = speakers[i].photo;
      speakers[i] = { id: speakers[i].id, ...value };
      await writeJson('speakers', speakers);
      // Clean up the replaced photo file, but only if no other speaker still uses it.
      if (oldPhoto !== value.photo && !speakers.some((x) => x.photo === oldPhoto)) await removeUpload(oldPhoto);
      return speakers[i];
    });
    res.json(updated);
  } catch (e) { next(e); }
}

export async function deleteSpeaker(req, res, next) {
  try {
    await withLock(async () => {
      const speakers = await readJson('speakers');
      const i = speakers.findIndex((s) => s.id === req.params.id);
      if (i === -1) throw notFound(`Speaker "${req.params.id}" was not found.`);
      const sessions = await readJson('sessions');
      const used = sessions.filter((s) => s.speakerIds.includes(req.params.id));
      if (used.length)
        throw conflict(
          `Cannot delete this speaker: they are assigned to ${used.length} session(s). Remove them from those sessions first.`,
          { sessions: used.map((s) => ({ id: s.id, title: s.title })) },
        );
      const [removed] = speakers.splice(i, 1);
      await writeJson('speakers', speakers);
      if (!speakers.some((x) => x.photo === removed.photo)) await removeUpload(removed.photo);
    });
    res.status(204).end();
  } catch (e) { next(e); }
}
