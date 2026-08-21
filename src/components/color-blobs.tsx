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
