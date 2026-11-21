/** Speaker preview card (whole card is one link via a stretched ::after) and the shared SocialLinks list. */
import { Link } from 'react-router-dom';
import { Github, Linkedin, Twitter } from 'lucide-react';
import Avatar from './Avatar.jsx';

export function SocialLinks({ socials = {}, name }) {
  const items = [['linkedin', Linkedin, 'LinkedIn'], ['github', Github, 'GitHub'], ['twitter', Twitter, 'X / Twitter']].filter(([k]) => socials[k]);
  if (!items.length) return null;
  return (
    <ul className="flex gap-3">
      {items.map(([k, Icon, label]) => (
        <li key={k}><a href={socials[k]} target="_blank" rel="noopener noreferrer" aria-label={`${name} on ${label}`} className="text-mute transition hover:text-ink"><Icon className="h-[18px] w-[18px]" /></a></li>
      ))}
    </ul>
  );
}

export default function SpeakerCard({ speaker, sessions = [] }) {
  return (
    <article className="card card-hover relative flex h-full flex-col overflow-hidden">
      <Avatar name={speaker.name} src={speaker.photo} className="aspect-[4/3] w-full" rounded="rounded-none" />
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-2xl font-bold leading-tight">
          <Link to={`/speakers/${speaker.id}`} className="after:absolute after:inset-0 hover:underline hover:decoration-2 hover:underline-offset-4">{speaker.name}</Link>
        </h3>
        <p className="mt-1 text-sm font-medium">{speaker.title}</p>
        <p className="text-sm text-mute">{speaker.company}</p>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-mute">{speaker.bio}</p>
        <p className="mt-4 text-xs text-mute" aria-label="Areas of expertise">{speaker.expertise.join(' / ')}</p>
        <div className="mt-auto flex items-center justify-between border-t border-line pt-4 mt-5">
          <span className="text-xs font-semibold">{sessions.length === 0 ? 'No sessions yet' : `${sessions.length} session${sessions.length === 1 ? '' : 's'}`}</span>
          <div className="relative z-10"><SocialLinks socials={speaker.socials} name={speaker.name} /></div>
        </div>
      </div>
    </article>
  );
}
