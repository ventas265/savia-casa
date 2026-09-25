export function PageTitle({ kicker, title }: { kicker?: string; title: string }) {
  return (
    <div>
      {kicker ? <p className="kicker">{kicker}</p> : null}
      <h1 className="font-display text-[2rem] font-semibold leading-[1.05] tracking-[-0.045em] text-ink">{title}</h1>
    </div>
  );
}

export const CHIP_TONES = ["bg-grad text-primary-fg", "glass text-fg", "glass text-fg", "glass text-fg"];
