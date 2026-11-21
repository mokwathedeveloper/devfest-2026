import { promises as fs } from 'node:fs';
import path from 'node:path';
import { AsyncLocalStorage } from 'node:async_hooks';
import { fileURLToPath } from 'node:url';
import { get, put, BlobPreconditionFailedError } from '@vercel/blob';
import { conflict } from './errors.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Bundled sample data. Always read-only; it also seeds the Blob store on first use. */
export const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, '..', 'data');

/**
 * Storage backends:
 *  - local files (default, local development)
 *  - Vercel Blob (when BLOB_READ_WRITE_TOKEN is set, e.g. on Vercel, where the filesystem is read-only)
 */
export const usesBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

const fileFor = (name) => path.join(DATA_DIR, `${name}.json`);
const blobPath = (name) => `data/${name}.json`;

/** ETags observed during the current locked read→modify→write run (Blob mode only). */
const runContext = new AsyncLocalStorage();

async function readBundled(name) {
  return JSON.parse(await fs.readFile(fileFor(name), 'utf8'));
}

async function fetchBlob(name) {
  const res = await get(blobPath(name), { access: 'public', useCache: false });
  if (!res || res.statusCode !== 200) return null;
  // Large bodies are served compressed with a weak ETag (W/"…"); conditional writes need the strong form.
  return { data: JSON.parse(await new Response(res.stream).text()), etag: res.blob.etag?.replace(/^W\//, '') };
}

async function readBlob(name) {
  let found = await fetchBlob(name);
  if (!found) {
    // First use: seed the store from the bundled sample data. A concurrent seeder losing the race is fine.
    const seed = await readBundled(name);
    await put(blobPath(name), JSON.stringify(seed, null, 2), {
      access: 'public', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: false, cacheControlMaxAge: 60,
    }).catch(() => {});
    found = (await fetchBlob(name)) || { data: seed, etag: undefined };
  }
  runContext.getStore()?.set(name, found.etag);
  return found.data;
}

/** Read and parse a JSON data file. */
export async function readJson(name) {
  return usesBlob() ? readBlob(name) : readBundled(name);
}

/** Atomic local write: write to a temp file, then rename over the target. */
async function writeLocal(name, data) {
  const target = fileFor(name);
  const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2) + '\n', 'utf8');
  await fs.rename(tmp, target);
}

async function writeBlob(name, data) {
  const ifMatch = runContext.getStore()?.get(name);
  try {
    const res = await put(blobPath(name), JSON.stringify(data, null, 2), {
      access: 'public', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 60,
      ...(ifMatch ? { ifMatch } : {}),
    });
    runContext.getStore()?.set(name, res.etag);
  } catch (e) {
    if (e instanceof BlobPreconditionFailedError) throw conflict('Someone else saved changes at the same moment. Please reload and try again.');
    throw e;
  }
}

export async function writeJson(name, data) {
  return usesBlob() ? writeBlob(name, data) : writeLocal(name, data);
}

/**
 * All mutations go through a promise-chain mutex so requests in one process run one at a time
 * (read → validate → write). On Vercel, where several instances can run at once, Blob writes are
 * additionally guarded by ETag (`ifMatch`): a write based on stale data is rejected, never lost.
 */
let lock = Promise.resolve();
export function withLock(task) {
  const run = lock.then(() => runContext.run(new Map(), task), () => runContext.run(new Map(), task));
  lock = run.catch(() => {});
  return run;
}
