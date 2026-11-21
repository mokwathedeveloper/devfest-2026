/** Event information (name, dates, venue, rooms, session types). One record, so there is only read and replace. */
import { readJson, writeJson, withLock } from '../utils/jsonStore.js';
import { validateEvent } from '../utils/validators.js';
import { badRequest } from '../utils/errors.js';

export async function getEvent(_req, res, next) {
  try {
    res.json(await readJson('event'));
  } catch (e) { next(e); }
}

export async function updateEvent(req, res, next) {
  try {
    const { value, errors } = validateEvent(req.body);
    if (errors) throw badRequest('Invalid event data.', errors);
    await withLock(() => writeJson('event', value));
    res.json(value);
  } catch (e) { next(e); }
}
