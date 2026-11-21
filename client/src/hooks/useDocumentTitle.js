/** Sets the browser tab title for the current page ("Speakers · DevFest 2026"). */
import { useEffect } from 'react';
export function useDocumentTitle(title) {
  useEffect(() => { document.title = title ? `${title} · DevFest 2026` : 'DevFest 2026 — Speakers & Schedule'; }, [title]);
}
