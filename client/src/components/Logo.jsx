export default function Logo({ className = 'h-9 w-9' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" fill="none" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 20L5 32l12 12" stroke="#4285F4" />
      <path d="M47 20l12 12-12 12" stroke="#34A853" />
      <path d="M37 14L27 50" stroke="#EA4335" />
      <circle cx="32" cy="58" r="0" />
    </svg>
  );
}
