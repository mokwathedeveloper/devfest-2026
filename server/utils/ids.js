/** Sequential, human-readable IDs ("speaker-009") derived from the highest existing number. */
/** Generate the next sequential ID such as "speaker-009". */
export function nextId(prefix, items) {
  const max = items.reduce((m, it) => {
    const n = Number(String(it.id).split('-').pop());
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}
