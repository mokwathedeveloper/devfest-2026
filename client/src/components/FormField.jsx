/** Label + input wrapper that also shows a field's hint or validation error (used by the admin forms). */
export default function FormField({ label, error, hint, htmlFor, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-mute">{hint}</p>}
      {error && <p className="mt-1 text-xs font-medium text-g-red" role="alert">{error}</p>}
    </div>
  );
}
