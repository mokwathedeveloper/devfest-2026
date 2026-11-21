import { useCallback, useEffect, useState } from 'react';

/**
 * Runs an async `loader` on mount and whenever `deps` change; returns { data, loading, error, reload }.
 * The `cancelled` flag stops a slow, outdated response from overwriting a newer one (e.g. after quick navigation).
 * Previous data is kept while reloading, so lists don't flash empty after an admin edit.
 */
export function useFetch(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    loader()
      .then((data) => !cancelled && setState({ data, loading: false, error: null }))
      .catch((error) => !cancelled && setState({ data: null, loading: false, error }));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}
