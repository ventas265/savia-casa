import type { ReactNode } from "react";
import { haptic } from "@/lib/haptic";
import { ovulationDayNum } from "@/lib/cycle";

/**
 * Nocturna cycle ring: one dashed segment per cycle day.
 * Period days hot rose, estimated fertile window gradient (thicker),
 * past days brighter, today = glowing white knob.
 */
export function SegmentRing({
  cycleLength,
  periodLength,
  cycleDay,
  label,
  children,
  onClick,
  decorative = false,
}: {
  cycleLength: number;
  periodLength: number;
  cycleDay: number | null;
  label: string;
  children: ReactNode;
  onClick?: () => void;
  /** Render as a static illustration (no button). */
  decorative?: boolean;
}) {
  const n = Math.min(45, Math.max(21, cycleLength || 28));
  const plen = Math.max(2, periodLength || 5);
  const ov = ovulationDayNum(plen, n);
  const cx = 142;
  const cy = 142;
  const r = 124;
  const gap = n > 32 ? 1.8 : 2.2;
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
    if (d <= plen) stroke = "#FF4F7B";
    else if (d >= ov - 5 && d <= ov + 1) {
      stroke = "url(#ring-grad)";
      w = 9;
    } else if (cycleDay != null && d < cycleDay) stroke = "rgba(255,255,255,.34)";
    return { d, path: `M${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1}`, stroke, w };
  });
  const knob =
    cycleDay != null
      ? (() => {
          const a = rad(-90 + ((Math.min(cycleDay, n) - 0.5) * 360) / n);
          return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
        })()
      : null;

  const svg = (
    <svg viewBox="0 0 284 284" className="absolute inset-0 size-full overflow-visible" aria-hidden>
      <defs>
        <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF9A6B" />
          <stop offset="1" stopColor="#FF4F7B" />
        </linearGradient>
      </defs>
      {segs.map((s) => (
        <path
          key={s.d}
          d={s.path}
          fill="none"
          stroke={s.stroke}
          strokeWidth={s.w}
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
      {knob ? (
        <circle
          cx={knob.x}
          cy={knob.y}
          r={11}
          fill="#fff"
          stroke="#0D0A0F"
          strokeWidth={4}
          style={{ filter: "drop-shadow(0 0 10px rgba(255,255,255,.8))" }}
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
