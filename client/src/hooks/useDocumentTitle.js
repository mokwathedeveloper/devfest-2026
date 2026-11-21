import { useEffect } from 'react';
export function useDocumentTitle(title) {
  useEffect(() => { document.title = title ? `${title} · DevFest 2026` : 'DevFest 2026 — Speakers & Schedule'; }, [title]);
}
