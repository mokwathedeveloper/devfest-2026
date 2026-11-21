const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const isNonEmptyString = (v, max = 500) =>
  typeof v === 'string' && v.trim().length > 0 && v.trim().length <= max;

export function isValidDate(v) {
  if (typeof v !== 'string' || !DATE_RE.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}
export const isValidTime = (v) => typeof v === 'string' && TIME_RE.test(v);
export const toMinutes = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
export const overlaps = (a, b) =>
  a.date === b.date &&
  toMinutes(a.startTime) < toMinutes(b.endTime) &&
  toMinutes(b.startTime) < toMinutes(a.endTime);

const isHttpUrlOrEmpty = (v) => {
  if (v === undefined || v === null || v === '') return true;
  if (typeof v !== 'string' || v.length > 300) return false;
  try {
    const u = new URL(v);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};
const isPhoto = (v) =>
  v === undefined || v === '' || (typeof v === 'string' && v.length <= 300 && (v.startsWith('/') || isHttpUrlOrEmpty(v)) && !v.startsWith('//'));

const strList = (v, maxItems = 20) =>
  Array.isArray(v) && v.length <= maxItems && v.every((x) => isNonEmptyString(x, 60));

/** Validate + normalise a speaker payload. Returns { value, errors }. */
export function validateSpeaker(body) {
  const errors = {};
  const b = body && typeof body === 'object' ? body : {};
  if (!isNonEmptyString(b.name, 100)) errors.name = 'Name is required (max 100 characters).';
  if (!isNonEmptyString(b.title, 100)) errors.title = 'Professional title is required.';
  if (!isNonEmptyString(b.company, 100)) errors.company = 'Company or organization is required.';
  if (!isNonEmptyString(b.bio, 1500)) errors.bio = 'Biography is required (max 1500 characters).';
  if (!isPhoto(b.photo)) errors.photo = 'Photo must be an http(s) URL or a path starting with "/".';
  const expertise = b.expertise ?? [];
  if (!strList(expertise)) errors.expertise = 'Expertise must be a list of short text values.';
  const socials = b.socials ?? {};
  const cleanSocials = {};
  if (typeof socials !== 'object' || Array.isArray(socials)) {
    errors.socials = 'Socials must be an object.';
  } else {
    for (const key of ['linkedin', 'github', 'twitter']) {
      if (!isHttpUrlOrEmpty(socials[key])) errors[`socials.${key}`] = `${key} must be a valid http(s) URL.`;
      cleanSocials[key] = (socials[key] || '').trim();
    }
  }
  if (Object.keys(errors).length) return { errors };
  return {
    value: {
      name: b.name.trim(),
      title: b.title.trim(),
      company: b.company.trim(),
      bio: b.bio.trim(),
      photo: (b.photo || '').trim(),
      expertise: expertise.map((x) => x.trim()),
      socials: cleanSocials,
    },
  };
}

/** Validate + normalise a session payload. Referential checks happen in the controller. */
export function validateSession(body) {
  const errors = {};
  const b = body && typeof body === 'object' ? body : {};
  if (!isNonEmptyString(b.title, 150)) errors.title = 'Title is required (max 150 characters).';
  if (!isNonEmptyString(b.description, 3000)) errors.description = 'Description is required (max 3000 characters).';
  if (!Array.isArray(b.speakerIds) || b.speakerIds.length === 0 || !b.speakerIds.every((s) => isNonEmptyString(s, 60)))
    errors.speakerIds = 'Select at least one speaker.';
  else if (new Set(b.speakerIds).size !== b.speakerIds.length) errors.speakerIds = 'Duplicate speakers selected.';
  if (!isValidDate(b.date)) errors.date = 'Date must be a valid YYYY-MM-DD date.';
  if (!isValidTime(b.startTime)) errors.startTime = 'Start time must be HH:MM (24-hour).';
  if (!isValidTime(b.endTime)) errors.endTime = 'End time must be HH:MM (24-hour).';
  if (!errors.startTime && !errors.endTime && toMinutes(b.endTime) <= toMinutes(b.startTime))
    errors.endTime = 'End time must be after the start time.';
  if (!isNonEmptyString(b.room, 80)) errors.room = 'Room is required.';
  if (!isNonEmptyString(b.track, 80)) errors.track = 'Track is required.';
  if (!isNonEmptyString(b.type, 60)) errors.type = 'Session type is required.';
  if (Object.keys(errors).length) return { errors };
  return {
    value: {
      title: b.title.trim(),
      description: b.description.trim(),
      speakerIds: b.speakerIds.map((s) => s.trim()),
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
      room: b.room.trim(),
      track: b.track.trim(),
      type: b.type.trim(),
    },
  };
}

export function validateEvent(body) {
  const errors = {};
  const b = body && typeof body === 'object' ? body : {};
  if (!isNonEmptyString(b.name, 100)) errors.name = 'Event name is required.';
  if (!isNonEmptyString(b.tagline, 150)) errors.tagline = 'Tagline is required.';
  if (!isNonEmptyString(b.description, 2000)) errors.description = 'Description is required.';
  if (!isValidDate(b.startDate)) errors.startDate = 'Start date must be YYYY-MM-DD.';
  if (!isValidDate(b.endDate)) errors.endDate = 'End date must be YYYY-MM-DD.';
  if (!errors.startDate && !errors.endDate && b.endDate < b.startDate) errors.endDate = 'End date cannot be before the start date.';
  const v = b.venue && typeof b.venue === 'object' ? b.venue : {};
  if (!isNonEmptyString(v.name, 120)) errors['venue.name'] = 'Venue name is required.';
  if (!isNonEmptyString(v.city, 100)) errors['venue.city'] = 'City is required.';
  if (v.address !== undefined && typeof v.address !== 'string') errors['venue.address'] = 'Address must be text.';
  if (!Number.isInteger(b.expectedAttendees) || b.expectedAttendees < 0 || b.expectedAttendees > 1_000_000)
    errors.expectedAttendees = 'Expected attendees must be a whole number.';
  if (!Array.isArray(b.rooms) || b.rooms.length === 0 || !strList(b.rooms, 30)) errors.rooms = 'Provide at least one room.';
  if (!Array.isArray(b.sessionTypes) || b.sessionTypes.length === 0 || !strList(b.sessionTypes, 30))
    errors.sessionTypes = 'Provide at least one session type.';
  if (b.isDemo !== undefined && typeof b.isDemo !== 'boolean') errors.isDemo = 'isDemo must be true or false.';
  if (Object.keys(errors).length) return { errors };
  return {
    value: {
      isDemo: b.isDemo ?? true,
      demoNotice: typeof b.demoNotice === 'string' ? b.demoNotice.trim().slice(0, 300) : '',
      name: b.name.trim(),
      tagline: b.tagline.trim(),
      description: b.description.trim(),
      startDate: b.startDate,
      endDate: b.endDate,
      venue: { name: v.name.trim(), address: (v.address || '').trim(), city: v.city.trim() },
      expectedAttendees: b.expectedAttendees,
      rooms: [...new Set(b.rooms.map((x) => x.trim()))],
      sessionTypes: [...new Set(b.sessionTypes.map((x) => x.trim()))],
    },
  };
}
