/** Shared loading / error / empty states so every page handles these cases the same way. */
import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-mute" role="status" aria-live="polite">
      <Loader2 className="h-8 w-8 animate-spin text-ink" aria-hidden="true" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card h-64 animate-pulse bg-cream" />
      ))}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="mx-auto max-w-md py-20 text-center" role="alert">
      <AlertTriangle className="mx-auto h-10 w-10 text-g-red" aria-hidden="true" />
      <h2 className="mt-4 text-lg font-semibold">Something went wrong</h2>
      <p className="mt-1 text-sm text-mute">{error?.message || 'Unexpected error.'}</p>
      {onRetry && <button onClick={onRetry} className="btn-primary mt-5">Try again</button>}
    </div>
  );
}

export function EmptyState({ title, message, action, icon: Icon = Inbox }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cream">
        <Icon className="h-7 w-7 text-mute" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      {message && <p className="mt-1 text-sm text-mute">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
