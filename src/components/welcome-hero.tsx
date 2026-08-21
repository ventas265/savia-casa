export function WelcomeHero() {
  const r = 88;
  const c = 2 * Math.PI * r;
  const dash = c * 0.72;
  return (
    <div className="relative mx-auto mt-8 size-[15.5rem]">
      <svg viewBox="0 0 200 200" className="size-full -rotate-90" aria-hidden>
        <circle cx="100" cy="100" r={r} fill="none" stroke="var(--color-surface-2)" strokeWidth="12" />
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
        />
        <circle cx="100" cy="100" r={r} fill="none" stroke="var(--color-fertile)" strokeWidth="12" strokeDasharray={`${c * 0.12} ${c}`} strokeDashoffset={-dash} strokeLinecap="round" />
      </svg>
      <img
        src="/photos/inicio.jpg"
        alt=""
        className="absolute inset-[1.85rem] rounded-full object-cover shadow-card"
      />
    </div>
  );
}
