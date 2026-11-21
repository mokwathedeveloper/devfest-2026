import { useState } from 'react';
import { LogOut, Lock, Pencil, Plus, Trash2, Mic, Layers, Settings } from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useEvent } from '../hooks/useEvent.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { formatDate, formatTime, sortSessions } from '../utils/time.js';
import Modal from '../components/Modal.jsx';
import FormField from '../components/FormField.jsx';
import Avatar from '../components/Avatar.jsx';
import TrackBadge from '../components/TrackBadge.jsx';
import SpeakerForm from '../components/admin/SpeakerForm.jsx';
import SessionForm from '../components/admin/SessionForm.jsx';
import EventForm from '../components/admin/EventForm.jsx';
import { ErrorState, Loading } from '../components/States.jsx';

function Login() {
  const { login } = useAuth();
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault(); setBusy(true); setErr('');
    try { await login(pw); } catch (x) { setErr(x.message); setBusy(false); }
  }
  return (
    <div className="container-page flex justify-center py-20">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4 p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-g-blue/10"><Lock className="h-6 w-6 text-ink" aria-hidden="true" /></div>
        <h1 className="text-center text-2xl font-bold">Organizer login</h1>
        <FormField label="Admin password" htmlFor="pw" error={err}>
          <input id="pw" type="password" autoComplete="current-password" className="input" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus required />
        </FormField>
        <button className="btn-primary w-full" disabled={busy || !pw}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  );
}

function SpeakersTab({ speakers, reload }) {
  const [editing, setEditing] = useState(null); // null | 'new' | speaker
  const [error, setError] = useState('');
  const save = async (data) => {
    if (editing === 'new') await api.createSpeaker(data); else await api.updateSpeaker(editing.id, data);
    setEditing(null); reload();
  };
  const del = async (s) => {
    if (!window.confirm(`Delete ${s.name}? This cannot be undone.`)) return;
    setError('');
    try { await api.deleteSpeaker(s.id); reload(); } catch (e) { setError(e.message); }
  };
  return (
    <>
      <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">{speakers.length} speakers</h2><button className="btn-primary" onClick={() => setEditing('new')}><Plus className="h-4 w-4" />Add speaker</button></div>
      {error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-g-red" role="alert">{error}</p>}
      <ul className="card divide-y divide-line">
        {speakers.map((s) => (
          <li key={s.id} className="flex items-center gap-4 p-4">
            <Avatar name={s.name} src={s.photo} className="h-12 w-12" />
            <div className="min-w-0 flex-1"><p className="truncate font-semibold">{s.name}</p><p className="truncate text-sm text-mute">{s.title} · {s.company}</p></div>
            <button className="btn-outline !px-3 !py-2" onClick={() => setEditing(s)} aria-label={`Edit ${s.name}`}><Pencil className="h-4 w-4" /></button>
            <button className="btn-outline !px-3 !py-2 hover:!border-g-red hover:!text-g-red" onClick={() => del(s)} aria-label={`Delete ${s.name}`}><Trash2 className="h-4 w-4" /></button>
          </li>
        ))}
        {speakers.length === 0 && <li className="p-8 text-center text-mute">No speakers yet.</li>}
      </ul>
      {editing && <Modal wide title={editing === 'new' ? 'Add speaker' : `Edit ${editing.name}`} onClose={() => setEditing(null)}><SpeakerForm initial={editing === 'new' ? null : editing} onSubmit={save} onCancel={() => setEditing(null)} /></Modal>}
    </>
  );
}

function SessionsTab({ sessions, speakers, reload }) {
  const { event, tracks } = useEvent();
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const save = async (data) => {
    if (editing === 'new') await api.createSession(data); else await api.updateSession(editing.id, data);
    setEditing(null); reload();
  };
  const del = async (s) => {
    if (!window.confirm(`Delete session “${s.title}”?`)) return;
    setError('');
    try { await api.deleteSession(s.id); reload(); } catch (e) { setError(e.message); }
  };
  return (
    <>
      <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">{sessions.length} sessions</h2><button className="btn-primary" onClick={() => setEditing('new')}><Plus className="h-4 w-4" />Add session</button></div>
      {error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-g-red" role="alert">{error}</p>}
      <ul className="card divide-y divide-line">
        {sortSessions(sessions).map((s) => (
          <li key={s.id} className="flex flex-wrap items-center gap-4 p-4">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{s.title}</p>
              <p className="mt-1 text-sm text-mute">{formatDate(s.date, { month: 'short', day: 'numeric' })} · {formatTime(s.startTime)}–{formatTime(s.endTime)} · {s.room}</p>
              <div className="mt-2"><TrackBadge track={s.track} /></div>
            </div>
            <button className="btn-outline !px-3 !py-2" onClick={() => setEditing(s)} aria-label={`Edit ${s.title}`}><Pencil className="h-4 w-4" /></button>
            <button className="btn-outline !px-3 !py-2 hover:!border-g-red hover:!text-g-red" onClick={() => del(s)} aria-label={`Delete ${s.title}`}><Trash2 className="h-4 w-4" /></button>
          </li>
        ))}
        {sessions.length === 0 && <li className="p-8 text-center text-mute">No sessions yet.</li>}
      </ul>
      {editing && <Modal wide title={editing === 'new' ? 'Add session' : 'Edit session'} onClose={() => setEditing(null)}>
        <SessionForm initial={editing === 'new' ? null : editing} speakers={speakers} tracks={tracks} event={event} onSubmit={save} onCancel={() => setEditing(null)} /></Modal>}
    </>
  );
}

function Dashboard() {
  useDocumentTitle('Admin');
  const { logout } = useAuth();
  const { event, reload: reloadEvent } = useEvent();
  const [tab, setTab] = useState('speakers');
  const { data, loading, error, reload } = useFetch(() => Promise.all([api.getSpeakers(), api.getSessions()]), []);
  const [speakers = [], sessions = []] = data || [];
  const tabs = [['speakers', 'Speakers', Mic], ['sessions', 'Sessions', Layers], ['event', 'Event info', Settings]];

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Admin dashboard</h1>
        <button className="btn-outline" onClick={logout}><LogOut className="h-4 w-4" />Sign out</button>
      </div>
      <div role="tablist" aria-label="Admin sections" className="mt-6 flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map(([id, label, Icon]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition ${tab === id ? 'border-ink text-ink' : 'border-transparent text-mute hover:text-g-ink'}`}>
            <Icon className="h-4 w-4" aria-hidden="true" />{label}
          </button>
        ))}
      </div>
      <div className="mt-6" role="tabpanel">
        {loading ? <Loading /> : error ? <ErrorState error={error} onRetry={reload} /> : (
          <>
            {tab === 'speakers' && <SpeakersTab speakers={speakers} reload={reload} />}
            {tab === 'sessions' && <SessionsTab sessions={sessions} speakers={speakers} reload={reload} />}
            {tab === 'event' && event && <EventForm event={event} onSubmit={async (d) => { await api.updateEvent(d); reloadEvent(); }} />}
          </>
        )}
      </div>
    </div>
  );
}

export default function Admin() {
  useDocumentTitle('Admin');
  const { authed, checking } = useAuth();
  if (checking) return <Loading label="Checking session…" />;
  return authed ? <Dashboard /> : <Login />;
}
