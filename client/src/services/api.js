/**
 * The ONLY place the frontend talks to the backend. Components call `api.getSpeakers()` etc. and never use fetch directly.
 * Failures are normalised into ApiError (message for the user, status code, per-field `details` for forms).
 * The admin token is kept in sessionStorage, so it is forgotten when the browser tab is closed.
 */
const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const TOKEN_KEY = 'devfest.adminToken';

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const tokenStore = {
  get: () => { try { return sessionStorage.getItem(TOKEN_KEY); } catch { return null; } },
  set: (t) => { try { sessionStorage.setItem(TOKEN_KEY, t); } catch { /* ignore */ } },
  clear: () => { try { sessionStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } },
};

/**
 * Shared fetch wrapper. JSON bodies are serialised for you; pass a File/Blob (with `contentType`) to upload raw bytes.
 * `auth: true` attaches the admin token; a 401 on an authed call signs the admin out via a window event.
 */
async function request(path, { method = 'GET', body, auth = false, contentType } = {}) {
  const headers = {};
  const isFile = typeof Blob !== 'undefined' && body instanceof Blob;
  if (body !== undefined) headers['Content-Type'] = isFile ? contentType : 'application/json';
  if (auth) {
    const t = tokenStore.get();
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  let res;
  try {
    res = await fetch(`${BASE}${path}`, { method, headers, body: body === undefined ? undefined : isFile ? body : JSON.stringify(body) });
  } catch {
    throw new ApiError('Cannot reach the server. Please check that the backend is running.', 0);
  }
  if (res.status === 204) return null;
  let data = null;
  try { data = await res.json(); } catch { /* non-JSON */ }
  if (!res.ok) {
    if (res.status === 401 && auth) window.dispatchEvent(new Event('devfest:unauthorized'));
    throw new ApiError(data?.error || `Request failed (${res.status})`, res.status, data?.details);
  }
  return data;
}

export const api = {
  login: (password) => request('/auth/login', { method: 'POST', body: { password } }),
  verify: () => request('/auth/me', { auth: true }),
  /** Upload a JPEG/PNG/WebP file; resolves to { url } to store as the speaker's photo. */
  uploadPhoto: (file) => request('/uploads', { method: 'POST', body: file, auth: true, contentType: file.type }),
  getEvent: () => request('/event'),
  updateEvent: (e) => request('/event', { method: 'PUT', body: e, auth: true }),
  getTracks: () => request('/tracks'),
  getSpeakers: () => request('/speakers'),
  getSpeaker: (id) => request(`/speakers/${encodeURIComponent(id)}`),
  createSpeaker: (s) => request('/speakers', { method: 'POST', body: s, auth: true }),
  updateSpeaker: (id, s) => request(`/speakers/${encodeURIComponent(id)}`, { method: 'PUT', body: s, auth: true }),
  deleteSpeaker: (id) => request(`/speakers/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true }),
  getSessions: () => request('/sessions'),
  getSession: (id) => request(`/sessions/${encodeURIComponent(id)}`),
  createSession: (s) => request('/sessions', { method: 'POST', body: s, auth: true }),
  updateSession: (id, s) => request(`/sessions/${encodeURIComponent(id)}`, { method: 'PUT', body: s, auth: true }),
  deleteSession: (id) => request(`/sessions/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true }),
};
