import { createContext, useContext } from 'react';
import { api } from '../services/api.js';
import { useFetch } from './useFetch.js';

const Ctx = createContext(null);

/** Loads event info + tracks once for the whole app (header, footer, colours). */
export function EventProvider({ children }) {
  const ev = useFetch(() => Promise.all([api.getEvent(), api.getTracks()]), []);
  const [event, tracks] = ev.data || [null, []];
  const trackColor = (name) => tracks.find((t) => t.name === name)?.color || '#5F6368';
  return <Ctx.Provider value={{ event, tracks, trackColor, loading: ev.loading, error: ev.error, reload: ev.reload }}>{children}</Ctx.Provider>;
}
export const useEvent = () => useContext(Ctx);
