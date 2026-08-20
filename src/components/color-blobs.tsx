export function ColorBlobs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="blob -top-20 right-[-18%] h-72 w-72 bg-primary/35" />
      <div className="blob top-52 left-[-28%] h-80 w-80 bg-accent/30" style={{ animationDelay: "-5s" }} />
      <div className="blob bottom-24 right-[-8%] h-56 w-56 bg-[#ffc857]/35" style={{ animationDelay: "-9s" }} />
    </div>
  );
}

export function PageTitle({ kicker, title }: { kicker?: string; title: string }) {
  return (
    <div>
      {kicker ? <p className="text-sm font-medium text-muted">{kicker}</p> : null}
      <h1 className="text-3xl font-extrabold tracking-tight text-ink">{title}</h1>
    </div>
  );
}

export const CHIP_TONES = [
  "bg-primary text-primary-fg",
  "bg-accent text-ink",
  "bg-surface text-fg ring-1 ring-ink/10",
];
