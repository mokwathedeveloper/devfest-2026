import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { badRequest } from '../utils/errors.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_DIR = process.env.UPLOAD_DIR ? path.resolve(process.env.UPLOAD_DIR) : path.join(__dirname, '..', 'uploads');
export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;

/** Identify the real file type from its first bytes; never trust the client's Content-Type. */
function sniff(buf) {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.length > 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
}

export async function uploadPhoto(req, res, next) {
  try {
    const buf = req.body;
    if (!Buffer.isBuffer(buf) || buf.length === 0) throw badRequest('No image received. Choose a JPEG, PNG or WebP file.');
    const ext = sniff(buf);
    if (!ext) throw badRequest('Unsupported file. Please upload a JPEG, PNG or WebP image.');
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const name = `${crypto.randomBytes(12).toString('hex')}.${ext}`;
    await fs.writeFile(path.join(UPLOAD_DIR, name), buf, { flag: 'wx' });
    res.status(201).json({ url: `/uploads/${name}` });
  } catch (e) { next(e); }
}

/** Delete an uploaded file once nothing references it. Only touches files we generated (strict name check). */
export async function removeUpload(url) {
  const m = typeof url === 'string' && url.match(/^\/uploads\/([a-f0-9]{24}\.(?:jpg|png|webp))$/);
  if (!m) return;
  await fs.unlink(path.join(UPLOAD_DIR, m[1])).catch(() => {});
}
