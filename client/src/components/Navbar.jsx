import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Logo from './Logo.jsx';
import { useMySchedule } from '../hooks/useMySchedule.jsx';

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/speakers', label: 'Speakers' },
  { to: '/schedule', label: 'Schedule' },
  { to: '/my-schedule', label: 'My schedule' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { ids } = useMySchedule();
  const { pathname } = useLocation();
  useEffect(() => { setOpen(false); }, [pathname]);

  const cls = ({ isActive }) =>
    `px-3 py-1.5 text-sm font-medium transition ${isActive ? 'border-b-2 border-ink text-ink' : 'border-b-2 border-transparent text-mute hover:text-ink'}`;

  return (
    <nav className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur" aria-label="Main">
      <div className="container-page flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5" aria-label="DevFest 2026 home">
          <Logo className="h-8 w-8" />
          <span className="font-display text-xl font-bold tracking-tight">DevFest 2026</span>
        </Link>
        <div className="hidden items-center gap-2 md:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={cls}>
              {l.label}
              {l.to === '/my-schedule' && ids.length > 0 && <span className="ml-1.5 text-xs font-bold text-g-red" aria-label={`${ids.length} saved`}>({ids.length})</span>}
            </NavLink>
          ))}
          <NavLink to="/admin" className={cls}>Organizers</NavLink>
        </div>
        <button className="rounded-md border border-line p-2 md:hidden" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-menu" aria-label="Toggle menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div id="mobile-menu" className="border-t border-line bg-paper px-5 pb-3 md:hidden">
          {[...links, { to: '/admin', label: 'Organizers' }].map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => `block border-b border-line/70 py-3 font-display text-lg ${isActive ? 'text-g-red' : ''}`}>
              {l.label}{l.to === '/my-schedule' && ids.length > 0 && ` (${ids.length})`}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
}
