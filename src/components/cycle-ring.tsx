import { haptic } from "@/lib/haptic";
import { cn } from "@/lib/utils";

export function CycleRing({
  progress,
  kicker,
  title,
  sub,
  onClick,
}: {
  progress: number;
  kicker?: string | null;
  title: string;
  sub?: string;
  onClick?: () => void;
}) {
  const p = Math.min(1, Math.max(0, progress));
  const r = 88;
  const c = 2 * Math.PI * r;
  const dash = c * p;

  return (
    <button
      type="button"
      onClick={() => {
        haptic(16);
        onClick?.();
      }}
      className="press relative mx-auto mt-6 block size-[17.5rem]"
      aria-label={title}
    >
      <svg viewBox="0 0 200 200" className="size-full -rotate-90">
        <circle cx="100" cy="100" r={r} fill="none" stroke="var(--color-surface-2)" strokeWidth="14" />
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          className="ring-draw"
        />
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="4"
          strokeDasharray={`${c * 0.12} ${c}`}
          strokeDashoffset={-c * Math.min(0.85, p * 0.9)}
          opacity="0.9"
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
        {kicker ? <span className="text-sm font-semibold text-muted">{kicker}</span> : null}
        <span
          className={cn(
            "font-display font-semibold tracking-tight text-primary",
            kicker ? "text-5xl" : "text-4xl leading-tight",
          )}
        >
          {title}
        </span>
        {sub ? <span className="mt-2 text-sm font-medium">{sub}</span> : null}
      </span>
    </button>
  );
}
