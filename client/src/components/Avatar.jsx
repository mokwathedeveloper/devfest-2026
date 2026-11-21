import { useState } from 'react';
import { initials } from '../utils/time.js';

const COLORS = ['#3F7BEA', '#2F9A5B', '#E2493B', '#F2B01E', '#9A5CC6', '#2BA6B8'];

/** Speaker photo with graceful fallback to initials on a flat colour. */
export default function Avatar({ name, src, className = 'h-16 w-16', rounded = 'rounded-full' }) {
  const [failed, setFailed] = useState(false);
  const color = COLORS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];
  if (!src || failed)
    return <div className={`${className} ${rounded} flex shrink-0 items-center justify-center font-display text-3xl font-bold text-white`} style={{ backgroundColor: color }} role="img" aria-label={name}>{initials(name)}</div>;
  return <img src={src} alt={name} loading="lazy" onError={() => setFailed(true)} className={`${className} ${rounded} shrink-0 object-cover`} />;
}
