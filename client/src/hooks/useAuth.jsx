import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, tokenStore } from '../services/api.js';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(!!tokenStore.get());

  useEffect(() => {
    if (!tokenStore.get()) return;
    api.verify().then(() => setAuthed(true)).catch(() => tokenStore.clear()).finally(() => setChecking(false));
  }, []);
  const logout = useCallback(() => { tokenStore.clear(); setAuthed(false); }, []);
  useEffect(() => {
    window.addEventListener('devfest:unauthorized', logout);
    return () => window.removeEventListener('devfest:unauthorized', logout);
  }, [logout]);
  const login = useCallback(async (password) => {
    const { token } = await api.login(password);
    tokenStore.set(token);
    setAuthed(true);
  }, []);
  return <Ctx.Provider value={{ authed, checking, login, logout }}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);
