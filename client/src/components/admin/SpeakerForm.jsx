/** Add/edit speaker form (admin). Uploads the photo first, then stores the returned URL in the speaker record. */
import { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import FormField from '../FormField.jsx';
import Avatar from '../Avatar.jsx';
import { api } from '../../services/api.js';

const empty = { name: '', title: '', company: '', bio: '', photo: '', expertise: '', linkedin: '', github: '', twitter: '' };

export default function SpeakerForm({ initial, onSubmit, onCancel }) {
  const [f, setF] = useState(initial ? {
    ...empty, ...initial, expertise: initial.expertise.join(', '),
    linkedin: initial.socials?.linkedin || '', github: initial.socials?.github || '', twitter: initial.socials?.twitter || '',
  } : empty);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhotoError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return setPhotoError('Please choose a JPEG, PNG or WebP image.');
    if (file.size > 3 * 1024 * 1024) return setPhotoError('That image is over 3 MB. Please choose a smaller one.');
    setUploading(true);
    try { const { url } = await api.uploadPhoto(file); setF((p) => ({ ...p, photo: url })); }
    catch (err) { setPhotoError(err.message); }
    setUploading(false);
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErrors({}); setFormError('');
    try {
      await onSubmit({
        name: f.name, title: f.title, company: f.company, bio: f.bio, photo: f.photo,
        expertise: f.expertise.split(',').map((x) => x.trim()).filter(Boolean),
        socials: { linkedin: f.linkedin, github: f.github, twitter: f.twitter },
      });
    } catch (err) {
      setErrors(err.details || {}); setFormError(err.message); setBusy(false);
    }
  }
  const field = (k, label, props = {}) => (
    <FormField label={label} htmlFor={`sp-${k}`} error={errors[k] || errors[`socials.${k}`]}>
      <input id={`sp-${k}`} className="input" value={f[k]} onChange={set(k)} {...props} />
    </FormField>
  );
  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {formError && <p className="rounded-md bg-red-50 p-3 text-sm text-g-red" role="alert">{formError}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {field('name', 'Full name *', { required: true })}
        {field('title', 'Professional title *', { required: true })}
        {field('company', 'Company / organization *', { required: true })}
      </div>
      <div className="flex items-center gap-4">
        <Avatar key={f.photo} name={f.name || 'Speaker'} src={f.photo} className="h-24 w-24" rounded="rounded-md" />
        <div>
          <p className="label">Profile photo</p>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" id="sp-photo-file" onChange={onFile} />
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-outline !py-1.5 !text-xs" onClick={() => fileRef.current?.click()} disabled={uploading}><Upload className="h-3.5 w-3.5" />{uploading ? 'Uploading…' : f.photo ? 'Replace photo' : 'Upload photo'}</button>
            {f.photo && <button type="button" className="btn-outline !py-1.5 !text-xs" onClick={() => setF((p) => ({ ...p, photo: '' }))}><X className="h-3.5 w-3.5" />Remove</button>}
          </div>
          <p className="mt-1 text-xs text-mute">JPEG, PNG or WebP, up to 3 MB. Square images look best.</p>
          {(photoError || errors.photo) && <p className="mt-1 text-xs font-medium text-g-red" role="alert">{photoError || errors.photo}</p>}
        </div>
      </div>
      <FormField label="Biography *" htmlFor="sp-bio" error={errors.bio}>
        <textarea id="sp-bio" rows={4} className="input" value={f.bio} onChange={set('bio')} required />
      </FormField>
      <FormField label="Expertise" htmlFor="sp-exp" error={errors.expertise} hint="Comma-separated, e.g. AI, Cloud Computing">
        <input id="sp-exp" className="input" value={f.expertise} onChange={set('expertise')} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-3">
        {field('linkedin', 'LinkedIn URL', { type: 'url' })}
        {field('github', 'GitHub URL', { type: 'url' })}
        {field('twitter', 'X / Twitter URL', { type: 'url' })}
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-outline" onClick={onCancel}>Cancel</button>
        <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save speaker'}</button>
      </div>
    </form>
  );
}
