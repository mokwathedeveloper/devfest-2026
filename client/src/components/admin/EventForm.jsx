import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import FormField from '../FormField.jsx';

const list = (s) => s.split(/[,\n]/).map((x) => x.trim()).filter(Boolean);

export default function EventForm({ event, onSubmit }) {
  const [f, setF] = useState({ ...event, venueName: event.venue.name, venueAddress: event.venue.address, venueCity: event.venue.city, rooms: event.rooms.join(', '), sessionTypes: event.sessionTypes.join(', '), expectedAttendees: String(event.expectedAttendees) });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => { setSaved(false); setF((p) => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })); };

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErrors({}); setFormError(''); setSaved(false);
    try {
      await onSubmit({
        isDemo: f.isDemo, demoNotice: f.demoNotice, name: f.name, tagline: f.tagline, description: f.description,
        startDate: f.startDate, endDate: f.endDate,
        venue: { name: f.venueName, address: f.venueAddress, city: f.venueCity },
        expectedAttendees: /^\d+$/.test(f.expectedAttendees) ? Number(f.expectedAttendees) : NaN,
        rooms: list(f.rooms), sessionTypes: list(f.sessionTypes),
      });
      setSaved(true);
    } catch (err) { setErrors(err.details || {}); setFormError(err.message); }
    setBusy(false);
  }
  const input = (k, label, props = {}) => (
    <FormField label={label} htmlFor={`ev-${k}`} error={errors[k] || errors[k.replace(/^venue(\w)/, (_, c) => `venue.${c.toLowerCase()}`)]}>
      <input id={`ev-${k}`} className="input" value={f[k] ?? ''} onChange={set(k)} {...props} />
    </FormField>
  );
  return (
    <form onSubmit={submit} className="card max-w-3xl space-y-4 p-6" noValidate>
      {formError && <p className="rounded-md bg-red-50 p-3 text-sm text-g-red" role="alert">{formError}</p>}
      {saved && <p className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-g-green" role="status"><CheckCircle2 className="h-4 w-4" />Event information saved.</p>}
      <div className="grid gap-4 sm:grid-cols-2">{input('name', 'Event name *')}{input('tagline', 'Tagline *')}</div>
      <FormField label="Description *" htmlFor="ev-desc" error={errors.description}><textarea id="ev-desc" rows={4} className="input" value={f.description} onChange={set('description')} /></FormField>
      <div className="grid gap-4 sm:grid-cols-3">
        {input('startDate', 'Start date *', { type: 'date' })}{input('endDate', 'End date *', { type: 'date' })}{input('expectedAttendees', 'Expected attendees *', { inputMode: 'numeric' })}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">{input('venueName', 'Venue name *')}{input('venueAddress', 'Address')}{input('venueCity', 'City *')}</div>
      <FormField label="Rooms *" htmlFor="ev-rooms" error={errors.rooms} hint="Comma-separated. Removing a room does not alter existing sessions."><input id="ev-rooms" className="input" value={f.rooms} onChange={set('rooms')} /></FormField>
      <FormField label="Session types *" htmlFor="ev-types" error={errors.sessionTypes} hint="Comma-separated."><input id="ev-types" className="input" value={f.sessionTypes} onChange={set('sessionTypes')} /></FormField>
      <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={!!f.isDemo} onChange={set('isDemo')} className="h-4 w-4 accent-ink" />Show “demonstration data” banner</label>
      {f.isDemo && input('demoNotice', 'Banner text')}
      <div className="flex justify-end"><button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save event information'}</button></div>
    </form>
  );
}
