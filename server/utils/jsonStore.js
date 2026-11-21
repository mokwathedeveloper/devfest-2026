import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, '..', 'data');

const fileFor = (name) => path.join(DATA_DIR, `${name}.json`);

/** Read and parse a JSON data file. */
export async function readJson(name) {
  const raw = await fs.readFile(fileFor(name), 'utf8');
  return JSON.parse(raw);
}

/** Atomic write: write to a temp file, then rename over the target. */
async function writeJsonAtomic(name, data) {
  const target = fileFor(name);
  const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2) + '\n', 'utf8');
  await fs.rename(tmp, target);
}

/**
 * All mutations go through a single promise-chain mutex, so concurrent
 * requests run one at a time (read → modify → write) and can never
 * interleave or lose updates. Cross-file rules (e.g. a session must
 * reference existing speakers) are also checked inside the lock.
 */
let lock = Promise.resolve();
export function withLock(task) {
  const run = lock.then(task, task);
  lock = run.catch(() => {});
  return run;
}

export { writeJsonAtomic as writeJson };
