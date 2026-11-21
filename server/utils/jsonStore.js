import { promises as fs } from 'node:fs';
import path from 'node:path';
import { AsyncLocalStorage } from 'node:async_hooks';
import { fileURLToPath } from 'node:url';
import { get, put, list, del, BlobError } from '@vercel/blob';
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

/**
 * Blob storage layout: every save creates a NEW immutable file  data/<name>/v000042.json  and the
 * highest version is the current data. Overwriting one file is not read-after-write consistent on Blob,
 * but creating a new file is, and creating a version that already exists is rejected, which gives us
 * atomic conflict detection between concurrent serverless instances for free.
 */
const KEEP_VERSIONS = 5;
const prefixFor = (name) => `data/${name}/`;
const versionPath = (name, v) => `${prefixFor(name)}v${String(v).padStart(6, '0')}.json`;
const versionOf = (pathname) => Number(pathname.match(/v(\d+)\.json$/)?.[1] ?? 0);

/** Versions seen by the current locked read→modify→write run. */
const runContext = new AsyncLocalStorage();

async function readBundled(name) {
  return JSON.parse(await fs.readFile(fileFor(name), 'utf8'));
}

async function latestBlob(name) {
  const { blobs } = await list({ prefix: prefixFor(name), limit: 1000 });
  return blobs.reduce((best, b) => (!best || versionOf(b.pathname) > versionOf(best.pathname) ? b : best), null);
}

const isAlreadyExists = (e) => e instanceof BlobError && /exist/i.test(e.message);

async function createVersion(name, version, data) {
  await put(versionPath(name, version), JSON.stringify(data, null, 2), {
    access: 'public', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: false,
  });
}

async function readBlob(name) {
  let latest = await latestBlob(name);
  if (!latest) {
    // First use: seed version 1 from the bundled sample data. Losing a seeding race is fine.
    const seed = await readBundled(name);
    await createVersion(name, 1, seed).catch((e) => { if (!isAlreadyExists(e)) throw e; });
    runContext.getStore()?.set(name, 1);
    return seed;
  }
  const res = await get(latest.pathname, { access: 'public' }); // versions are immutable, so CDN caching is safe
  if (!res || res.statusCode !== 200) throw new Error(`Could not read ${latest.pathname}`);
  runContext.getStore()?.set(name, versionOf(latest.pathname));
  return JSON.parse(await new Response(res.stream).text());
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
  const ctx = runContext.getStore();
  let base = ctx?.get(name);
  if (base === undefined) base = versionOf((await latestBlob(name))?.pathname ?? ''); // write without a prior read
  const next = base + 1;
  try {
    await createVersion(name, next, data);
  } catch (e) {
    if (isAlreadyExists(e)) throw conflict('Someone else saved changes at the same moment. Please reload and try again.');
    throw e;
  }
  ctx?.set(name, next);
  // Best-effort cleanup of old versions; never fail the request because of it.
  try {
    const { blobs } = await list({ prefix: prefixFor(name), limit: 1000 });
    const stale = blobs.filter((b) => versionOf(b.pathname) <= next - KEEP_VERSIONS).map((b) => b.url);
    if (stale.length) await del(stale);
  } catch { /* ignore */ }
}

export async function writeJson(name, data) {
  return usesBlob() ? writeBlob(name, data) : writeLocal(name, data);
}

/**
 * All mutations go through a promise-chain mutex so requests in one process run one at a time
 * (read → validate → write). On Vercel, where several instances can run at once, the version-numbered
 * Blob files above reject a write that was based on stale data instead of silently overwriting it.
 */
let lock = Promise.resolve();
export function withLock(task) {
  const run = lock.then(() => runContext.run(new Map(), task), () => runContext.run(new Map(), task));
  lock = run.catch(() => {});
  return run;
}
