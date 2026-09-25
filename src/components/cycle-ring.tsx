import type { ReactNode } from "react";
import { haptic } from "@/lib/haptic";
import { ovulationDayNum } from "@/lib/cycle";

/** Fine-line heart path centred on (0,0), ~10px wide. */
const HEART =
  "M0 3.6C-2.9 1.5-4.6-.2-4.6-2c0-1.3 1-2.3 2.3-2.3.9 0 1.7.5 2.3 1.3.6-.8 1.4-1.3 2.3-1.3 1.3 0 2.3 1 2.3 2.3 0 1.8-1.7 3.5-4.6 5.6z";

/**
 * Nocturna cycle ring (V2 Baya): one rounded petal per cycle day.
 * Period days berry, estimated fertile window aqua (thicker, ovulation
 * day brightest), past days brighter, today = glowing pearl knob.
 * Sex days: fine-line hearts just outside the ring (filled = unprotected).
 */
export function SegmentRing({
  cycleLength,
  periodLength,
  cycleDay,
  label,
  children,
  onClick,
  decorative = false,
  sexDays = [],
}: {
  cycleLength: number;
  periodLength: number;
  cycleDay: number | null;
  label: string;
  children: ReactNode;
  onClick?: () => void;
  /** Render as a static illustration (no button). */
  decorative?: boolean;
  /** Cycle-day numbers (this cycle) with sex logged. */
  sexDays?: { n: number; kind: string }[];
}) {
  const n = Math.min(45, Math.max(21, cycleLength || 28));
  const plen = Math.max(2, periodLength || 5);
  const ov = ovulationDayNum(plen, n);
  const cx = 142;
  const cy = 142;
  const r = 124;
  // Wider gap + round caps = soft petals instead of hard dashes.
  const gap = n > 32 ? 2.6 : 3.1;
  const rad = (x: number) => (x * Math.PI) / 180;
  const segs = Array.from({ length: n }, (_, i) => {
    const d = i + 1;
    const a0 = -90 + (i * 360) / n + gap;
    const a1 = -90 + (d * 360) / n - gap;
    const x0 = cx + r * Math.cos(rad(a0));
    const y0 = cy + r * Math.sin(rad(a0));
    const x1 = cx + r * Math.cos(rad(a1));
    const y1 = cy + r * Math.sin(rad(a1));
    let stroke = "rgba(255,255,255,.12)";
    let w = 7;
    let glow = false;
    if (d <= plen) stroke = "#FF4D84";
    else if (d === ov) {
      stroke = "#6FE0D2";
      w = 10;
      glow = true;
    } else if (d >= ov - 5 && d <= ov + 1) {
      stroke = "url(#ring-fert)";
      w = 9;
    } else if (cycleDay != null && d < cycleDay) stroke = "rgba(255,255,255,.34)";
    return { d, path: `M${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1}`, stroke, w, glow };
  });
  const knob =
    cycleDay != null
      ? (() => {
          const a = rad(-90 + ((Math.min(cycleDay, n) - 0.5) * 360) / n);
          return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
        })()
      : null;
  const hearts = sexDays
    .filter((s) => s.n >= 1 && s.n <= n)
    .map((s) => {
      const a = rad(-90 + ((s.n - 0.5) * 360) / n);
      const hr = r + 17;
      return { key: `${s.n}-${s.kind}`, x: cx + hr * Math.cos(a), y: cy + hr * Math.sin(a), filled: s.kind !== "protected" };
    });

  const svg = (
    <svg viewBox="0 0 284 284" className="absolute inset-0 size-full overflow-visible" aria-hidden>
      <defs>
        <linearGradient id="ring-fert" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6FE0D2" />
          <stop offset="1" stopColor="#3FBDB0" />
        </linearGradient>
        <filter id="ring-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {segs.map((s) => (
        <path
          key={s.d}
          d={s.path}
          fill="none"
          stroke={s.stroke}
          strokeWidth={s.w}
          strokeLinecap="round"
          filter={s.glow ? "url(#ring-glow)" : undefined}
          className="seg-in"
          style={{ animationDelay: `${s.d * 16}ms` }}
        />
      ))}
      <circle
        cx={cx}
        cy={cy}
        r={104}
        fill="none"
        stroke="rgba(255,255,255,.08)"
        strokeDasharray="1 5"
      />
      {hearts.map((h) => (
        <path
          key={h.key}
          d={HEART}
          transform={`translate(${h.x} ${h.y})`}
          fill={h.filled ? "#FF4D84" : "none"}
          stroke="#FF8CB8"
          strokeWidth={1.1}
          strokeLinejoin="round"
        />
      ))}
      {knob ? (
        <circle
          cx={knob.x}
          cy={knob.y}
          r={11}
          fill="#fff"
          stroke="#0E0911"
          strokeWidth={4}
          style={{ filter: "drop-shadow(0 0 10px rgba(255,198,224,.85))" }}
        />
      ) : null}
    </svg>
  );
  const inner = (
    <span className="relative flex flex-col items-center px-10 text-center">{children}</span>
  );
  if (decorative) {
    return (
      <div aria-hidden className="relative mx-auto grid size-[16.6rem] place-items-center">
        {svg}
        {inner}
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => {
        haptic(16);
        onClick?.();
      }}
      aria-label={label}
      className="press relative mx-auto grid size-[16.6rem] place-items-center focus-visible:outline-none"
    >
      {svg}
      {inner}
    </button>
  );
}
