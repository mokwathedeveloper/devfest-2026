/**
 * `requireAdmin`: guards write endpoints. Expects `Authorization: Bearer <jwt>` issued by POST /api/auth/login.
 * The password itself is never stored; only its bcrypt hash lives in the ADMIN_PASSWORD_HASH environment variable.
 */
import jwt from 'jsonwebtoken';
import { HttpError } from '../utils/errors.js';

export function requireAdmin(req, _res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return next(new HttpError(401, 'Authentication required. Please sign in as admin.'));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== 'admin') throw new Error('bad role');
    req.admin = payload;
    next();
  } catch {
    next(new HttpError(401, 'Your session is invalid or has expired. Please sign in again.'));
  }
}
