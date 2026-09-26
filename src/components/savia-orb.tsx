import { useEffect, useState, type CSSProperties } from "react";
import { dayInfo, isCycling, periodDaysFromLogs, predictPeriod } from "@/lib/cycle";
import { SAVIA_BETA } from "@/lib/beta";
import { localToday } from "@/lib/savia-local";
import { loadToday } from "@/lib/savia-api";
import type { TodaySnapshot } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { toneFor, toneStyle, type SaviaTone } from "@/lib/savia-tone";

/** The Savia pearl, tinted by her phase. Colours cross-fade (registered CSS props). */
export function SaviaOrb({ tone = "none", className }: { tone?: SaviaTone; className?: string }) {
  return (
    <span
      aria-hidden
      data-tone={tone}
      className={cn("orb block shrink-0 rounded-full", className)}
      style={toneStyle(tone) as CSSProperties}
    />
  );
}

export function toneCaption(tone: SaviaTone, t: ReturnType<typeof useI18n>["t"]) {
  return tone === "menstrual"
    ? t.orbMenstrual
    : tone === "follicular"
      ? t.orbFollicular
      : tone === "fertile"
        ? t.orbFertile
        : tone === "luteal"
          ? t.orbLuteal
          : t.orbNone;
}

export function OrbCaption({ tone, className }: { tone: SaviaTone; className?: string }) {
  const { t } = useI18n();
  return (
    <span data-testid="orb-caption" className={cn("text-[11.5px] font-medium text-soft", className)}>
      {toneCaption(tone, t)}
    </span>
  );
}

/** Tone from a snapshot: fertile estimate > phase; confirmed bleeding = menstrual. */
export function toneFromSnapshot(snap: TodaySnapshot | null): SaviaTone {
  if (!snap || !isCycling(snap.profile.stage) || !snap.profile.lastPeriodStart) return "none";
  const p = snap.profile;
  const info = dayInfo(snap.day, {
    lastStart: p.lastPeriodStart,
    cycleLength: predictPeriod(p.lastPeriodStart, snap.periodStarts, p.cycleLength, p.stage).len,
    periodLength: p.periodLength,
    periodStarts: snap.periodStarts,
    periodDays: periodDaysFromLogs(snap.log ? [snap.log, ...snap.recentLogs] : snap.recentLogs),
    today: snap.day,
  });
  return toneFor(info.phase, info.mark, info.confirmed);
}

/** Client-only tone (on-device data); "none" during SSR / before hydration. */
export function useSaviaTone(): SaviaTone {
  const [tone, setTone] = useState<SaviaTone>("none");
  useEffect(() => {
    if (SAVIA_BETA) {
      setTone(toneFromSnapshot(localToday()));
      return;
    }
    let alive = true;
    loadToday()
      .then((s) => alive && setTone(toneFromSnapshot(s)))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return tone;
}
