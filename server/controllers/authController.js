import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { HttpError } from '../utils/errors.js';

export async function login(req, res, next) {
  try {
    const { password } = req.body || {};
    const hash = process.env.ADMIN_PASSWORD_HASH;
    if (!hash || !process.env.JWT_SECRET) throw new HttpError(500, 'Server is missing ADMIN_PASSWORD_HASH or JWT_SECRET configuration.');
    if (typeof password !== 'string' || !password) throw new HttpError(400, 'Password is required.');
    const ok = await bcrypt.compare(password, hash);
    if (!ok) throw new HttpError(401, 'Incorrect password.');
    const expiresIn = process.env.JWT_EXPIRES_IN || '8h';
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn });
    res.json({ token, expiresIn });
  } catch (e) {
    next(e);
  }
}

export const me = (_req, res) => res.json({ role: 'admin' });
