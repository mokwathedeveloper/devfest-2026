/** Read-only list of tracks (name + colour). Track names are what sessions reference in their `track` field. */
import { readJson } from '../utils/jsonStore.js';

export async function getTracks(_req, res, next) {
  try {
    res.json(await readJson('tracks'));
  } catch (e) { next(e); }
}
