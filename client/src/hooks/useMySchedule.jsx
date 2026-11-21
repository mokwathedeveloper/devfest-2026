import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const KEY = 'devfest2026.mySchedule';
const Ctx = createContext(null);

function load() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch { return []; }
}

/**
 * The attendee's saved sessions: a list of session IDs persisted in localStorage (no login needed).
 * Only IDs are stored; session details are fetched fresh, so organizer edits show up and deleted sessions can be detected.
 * Storage access is wrapped in try/catch because it throws in some private-browsing modes.
 */
export function MyScheduleProvider({ children }) {
  const [ids, setIds] = useState(load);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* storage unavailable */ }
  }, [ids]);
  useEffect(() => {
    const onStorage = (e) => e.key === KEY && setIds(load());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  const add = useCallback((id) => setIds((p) => (p.includes(id) ? p : [...p, id])), []);
  const remove = useCallback((id) => setIds((p) => p.filter((x) => x !== id)), []);
  const toggle = useCallback((id) => setIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])), []);
  const clear = useCallback(() => setIds([]), []);
  const value = useMemo(() => ({ ids, has: (id) => ids.includes(id), add, remove, toggle, clear }), [ids, add, remove, toggle, clear]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useMySchedule = () => useContext(Ctx);
