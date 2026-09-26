import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ChevronLeft, Coffee, Droplet, Footprints, Heart, Leaf, Moon, ShieldCheck, Sun } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTodaySnap } from "@/lib/use-today-snap";
import { fill, useV4 } from "@/lib/i18n-v4";
import { SEASONS, SEASON_ORDER, seasonRanges, type SeasonPhase } from "@/lib/v4-content";
import { dayInfo, isCycling, periodDaysFromLogs, predictPeriod, todayISO } from "@/lib/cycle";
import { pick } from "@/lib/savia-content";
import { cn } from "@/lib/utils";

/** 07 · «Por qué pasa» — tus cuatro estaciones + curva de hormonas con «hoy». */
export const Route = createFileRoute("/app/estaciones")({ component: Estaciones });

const TIP_ICON = { moon: Moon, cup: Coffee, drop: Droplet, walk: Footprints, leaf: Leaf, heart: Heart, sun: Sun, shield: ShieldCheck };

function Estaciones() {
  const { v, lang } = useV4();
  const router = useRouter();
  const { data } = useTodaySnap();
  if (!data) {
    return (
      <div className="space-y-4 px-2 pt-4" aria-busy="true">
        <Skeleton className="h-11 w-11 rounded-full" />
        <Skeleton className="h-10 w-60" />
        <Skeleton className="h-36 w-full rounded-[18px]" />
      </div>
    );
  }
  const p = data.profile;
  const cycling = isCycling(p.stage) && Boolean(p.lastPeriodStart);
  const pred = predictPeriod(p.lastPeriodStart, data.periodStarts, p.cycleLength, p.stage);
  const today = todayISO();
  const info = cycling
    ? dayInfo(today, {
        lastStart: p.lastPeriodStart,
        cycleLength: pred.len,
        periodLength: p.periodLength,
        periodStarts: data.periodStarts,
        periodDays: periodDaysFromLogs(data.recentLogs),
        today,
      })
    : null;
  const phase: SeasonPhase = info && info.phase !== "none" ? info.phase : "follicular";
  const s = SEASONS[phase];
  const ranges = seasonRanges(pred.len, p.periodLength);
  const len = pred.len;
  const dayNum = Math.min(info?.cycleDay ?? 1, len);
  // Hormone curves on a 350×120 box: x = day/len.
  const X = (d: number) => ((d - 1) / Math.max(1, len - 1)) * 350;
  const ov = Math.max(p.periodLength + 2, len - 14);
  const estro = (d: number) => {
    const peak = Math.exp(-(((d - (ov - 1)) / 3.2) ** 2));
    const second = 0.45 * Math.exp(-(((d - (ov + 7)) / 4.5) ** 2));
    return 100 - 70 * Math.max(peak, second) - 6;
  };
  const prog = (d: number) => 108 - 88 * Math.exp(-(((d - (ov + 7)) / 4.2) ** 2));
  const path = (fn: (d: number) => number) =>
    Array.from({ length: len * 2 }, (_, i) => 1 + (i * (len - 1)) / (len * 2 - 1))
      .map((d, i) => `${i ? "L" : "M"}${X(d).toFixed(1)} ${fn(d).toFixed(1)}`)
      .join(" ");
  const [ra, rb] = ranges[phase];

  return (
    <div className="px-2 pb-6">
      <button type="button" className="v4-ib mt-1" aria-label={v.back} onClick={() => router.history.back()}>
        <ChevronLeft className="size-5" strokeWidth={1.8} />
      </button>
      <p className="v4-eyebrow mt-4">{v.seasonsEyebrow}</p>
      <h1 className="v4-h1 mb-4 mt-1.5">{pick(s.youAreIn, lang)}</h1>
      <ul className="grid grid-cols-4 gap-2" data-testid="season-strip">
        {SEASON_ORDER.map((k) => {
          const it = SEASONS[k];
          const [a, b] = ranges[k];
          const now = cycling && k === phase;
          return (
            <li key={k} className={cn("v4-ss flex flex-col gap-[3px]", now && "now")} aria-current={now ? "true" : undefined}>
              <img src={it.thumb} alt={pick(it.alt, lang)} width={160} height={208} loading="lazy" />
              <b className="text-[13px] font-semibold leading-none">{pick(it.short, lang)}</b>
              <small className="text-[10.5px] font-medium leading-[1.25] text-muted">
                {pick(it.season, lang)}
                <br />
                {fill(v.days, { a, b })}
              </small>
            </li>
          );
        })}
      </ul>
      <div className="mt-[18px] flex flex-col items-center rounded-[26px] bg-white pb-2.5 pt-3.5">
        <svg viewBox="0 0 350 120" className="w-[326px] max-w-full" role="img" aria-label={`${v.progesterone}, ${v.estrogen}`}>
          <rect x={X(ra)} y="0" width={Math.max(8, X(rb) - X(ra))} height="120" fill={phase === "luteal" ? "#F1E3D3" : phase === "ovulatory" ? "#F1E6F5" : phase === "menstrual" ? "#F3DADD" : "#FAE6DA"} opacity=".7" rx="10" />
          <path d={path(estro)} stroke="#8E57A5" strokeWidth="2.5" fill="none" />
          <path d={path(prog)} stroke="#8E2A3F" strokeWidth="2.5" fill="none" />
          {cycling ? <circle cx={X(dayNum)} cy={prog(dayNum)} r="6" fill="#8E2A3F" stroke="#fff" strokeWidth="2.5" /> : null}
        </svg>
        <div className="flex w-full gap-3.5 px-3 pt-2.5 text-[12.5px] font-medium">
          <span className="flex items-center gap-1.5">
            <i className="v4-k" style={{ background: "#8E2A3F" }} />
            {v.progesterone}
          </span>
          <span className="flex items-center gap-1.5">
            <i className="v4-k" style={{ background: "#8E57A5" }} />
            {v.estrogen}
          </span>
          {cycling ? <span className="text-muted">● {v.today}</span> : null}
        </div>
      </div>
      {s.why.map((w) => (
        <p key={w.strong.es} className="mt-3.5 text-[16px] leading-[1.45] text-ink-2">
          <b className="font-semibold text-ink">{pick(w.strong, lang)}</b> {pick(w.rest, lang)}
        </p>
      ))}
      <div className="mt-3.5 flex flex-wrap gap-2" role="list">
        {s.whyTips.map((tip) => {
          const Icon = TIP_ICON[tip.icon];
          return (
            <span key={tip.icon} role="listitem" className={cn("v4-chip", s.key)}>
              <Icon className="size-[18px]" strokeWidth={1.8} aria-hidden />
              {pick(tip.text, lang)}
            </span>
          );
        })}
      </div>
      <p className="mt-3.5 text-[12px] font-medium leading-snug text-muted">{v.source}</p>
    </div>
  );
}
