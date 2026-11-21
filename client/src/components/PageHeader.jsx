export default function PageHeader({ title, subtitle, children }) {
  return (
    <header className="border-b border-line">
      <div className="container-page flex flex-col gap-5 py-12 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{title}</h1>
          {subtitle && <p className="mt-3 text-lg text-mute">{subtitle}</p>}
        </div>
        {children}
      </div>
    </header>
  );
}
