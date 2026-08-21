export function PageTitle({ kicker, title }: { kicker?: string; title: string }) {
  return (
    <div>
      {kicker ? <p className="text-sm font-medium text-muted">{kicker}</p> : null}
      <h1 className="font-display text-3xl font-semibold tracking-[-0.03em] text-ink">{title}</h1>
    </div>
  );
}

export const CHIP_TONES = [
  "bg-primary text-primary-fg",
  "bg-accent text-ink",
  "bg-surface text-fg ring-1 ring-ink/10",
];
