import { readJson } from '../utils/jsonStore.js';

export async function getTracks(_req, res, next) {
  try {
    res.json(await readJson('tracks'));
  } catch (e) { next(e); }
}
