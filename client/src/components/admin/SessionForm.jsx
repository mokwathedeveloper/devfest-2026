import { useState } from 'react';
import FormField from '../FormField.jsx';
import { toMinutes } from '../../utils/time.js';

export default function SessionForm({ initial, speakers, tracks, event, onSubmit, onCancel }) {
  const [f, setF] = useState(initial || {
    title: '', description: '', speakerIds: [], date: event.startDate, startTime: '09:00', endTime: '10:00',
    room: event.rooms[0] || '', track: tracks[0]?.name || '', type: event.sessionTypes[0] || '',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const toggleSpeaker = (id) => setF((p) => ({ ...p, speakerIds: p.speakerIds.includes(id) ? p.speakerIds.filter((x) => x !== id) : [...p.speakerIds, id] }));

  async function submit(e) {
    e.preventDefault();
    setErrors({}); setFormError('');
    // Fast client-side check; the server re-validates everything.
    if (f.startTime && f.endTime && toMinutes(f.endTime) <= toMinutes(f.startTime)) {
      setErrors({ endTime: 'End time must be after the start time.' });
      return;
    }
    setBusy(true);
    try { await onSubmit(f); } catch (err) { setErrors(err.details || {}); setFormError(err.message); setBusy(false); }
  }
  const select = (k, label, options) => (
    <FormField label={label} htmlFor={`se-${k}`} error={errors[k]}>
      <select id={`se-${k}`} className="input" value={f[k]} onChange={set(k)}>
        {!options.includes(f[k]) && f[k] && <option value={f[k]}>{f[k]} (not in list)</option>}
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </FormField>
  );
  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {formError && <p className="rounded-md bg-red-50 p-3 text-sm text-g-red" role="alert">{formError}</p>}
      <FormField label="Title *" htmlFor="se-title" error={errors.title}><input id="se-title" className="input" value={f.title} onChange={set('title')} required /></FormField>
      <FormField label="Description *" htmlFor="se-desc" error={errors.description}><textarea id="se-desc" rows={4} className="input" value={f.description} onChange={set('description')} required /></FormField>
      <fieldset>
        <legend className="label">Speakers *</legend>
        <div className="grid max-h-44 gap-1 overflow-y-auto rounded-md border border-line p-3 sm:grid-cols-2">
          {speakers.map((s) => (
            <label key={s.id} className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" checked={f.speakerIds.includes(s.id)} onChange={() => toggleSpeaker(s.id)} className="h-4 w-4 accent-ink" />{s.name}
            </label>
          ))}
          {speakers.length === 0 && <p className="text-sm text-mute">Add a speaker first.</p>}
        </div>
        {errors.speakerIds && <p className="mt-1 text-xs font-medium text-g-red" role="alert">{errors.speakerIds}</p>}
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label="Date *" htmlFor="se-date" error={errors.date}><input id="se-date" type="date" className="input" value={f.date} onChange={set('date')} min={event.startDate} max={event.endDate} /></FormField>
        <FormField label="Start *" htmlFor="se-st" error={errors.startTime}><input id="se-st" type="time" className="input" value={f.startTime} onChange={set('startTime')} /></FormField>
        <FormField label="End *" htmlFor="se-et" error={errors.endTime}><input id="se-et" type="time" className="input" value={f.endTime} onChange={set('endTime')} /></FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {select('room', 'Room *', event.rooms)}
        {select('track', 'Track *', tracks.map((t) => t.name))}
        {select('type', 'Type *', event.sessionTypes)}
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-outline" onClick={onCancel}>Cancel</button>
        <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save session'}</button>
      </div>
    </form>
  );
}
