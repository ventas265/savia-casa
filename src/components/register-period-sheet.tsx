import { useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Droplet } from "lucide-react";
import { BottomSheet } from "@/components/bottom-sheet";
import { useI18n } from "@/lib/i18n";
import { haptic } from "@/lib/haptic";
import { cycleLengthIfStarted, formatLong, knownStarts, todayISO } from "@/lib/cycle";
import { registerPeriod, undoPeriod } from "@/lib/savia-api";
import type { TodaySnapshot } from "@/lib/types";

/** Below this many days since the previous start we ask before saving. */
export const SHORT_CYCLE_DAYS = 15;

/**
 * «Registrar periodo»: ¿Te llegó hoy? [Hoy] [Otro día] → saves (merged into the
 * day's log) → toast with «Deshacer». A cycle shorter than 15 days asks first.
 */
export function RegisterPeriodSheet({
  lastStart,
  starts,
  onClose,
  onChange,
}: {
  lastStart: string | null;
  starts: string[];
  onClose: () => void;
  onChange: (snap: TodaySnapshot) => void;
}) {
  const { t, lang } = useI18n();
  const today = todayISO();
  const [mode, setMode] = useState<"ask" | "pick" | "confirm">("ask");
  const [day, setDay] = useState(today);
  const [busy, setBusy] = useState(false);
  const all = knownStarts(lastStart, starts);
  const gap = cycleLengthIfStarted(day, all);

  async function save(target: string, confirmed = false) {
    if (busy) return;
    if (all.includes(target)) {
      toast(t.regAlready.replace("{date}", formatLong(target, lang)));
      onClose();
      return;
    }
    const g = cycleLengthIfStarted(target, all);
    if (!confirmed && g != null && g < SHORT_CYCLE_DAYS) {
      setDay(target);
      setMode("confirm");
      return;
    }
    setBusy(true);
    haptic(16);
    try {
      const { snap, undo } = await registerPeriod(target);
      onChange(snap);
      onClose();
      toast.success(t.regSaved.replace("{date}", formatLong(target, lang)), {
        duration: 8000,
        action: {
          label: t.regUndo,
          onClick: () => {
            void undoPeriod(undo).then((s) => {
              onChange(s);
              toast(t.regUndone);
            });
          },
        },
      });
    } catch {
      toast.error(t.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  return (
    <BottomSheet
      title={mode === "confirm" ? t.regShortTitle : t.regAskTitle}
      kicker={t.actBleed}
      onClose={onClose}
      testId="register-period"
      labelledBy="reg-title"
    >
      {mode === "ask" ? (
        <div className="space-y-2.5">
          <p className="text-sm leading-relaxed text-muted">{t.regAskSub}</p>
          <button
            type="button"
            data-testid="reg-today"
            disabled={busy}
            onClick={() => void save(today)}
            className="press flex h-14 w-full items-center justify-center gap-2.5 rounded-full bg-grad text-base font-semibold text-primary-fg shadow-[0_10px_30px_-8px_rgb(242_66_126/0.6)] disabled:opacity-60"
          >
            <Droplet className="size-5" strokeWidth={1.8} aria-hidden />
            {t.regToday}
          </button>
          <button
            type="button"
            data-testid="reg-other"
            onClick={() => {
              setDay(today);
              setMode("pick");
            }}
            className="press glass flex h-14 w-full items-center justify-center gap-2.5 rounded-full text-base font-semibold"
          >
            <CalendarDays className="size-5" strokeWidth={1.6} aria-hidden />
            {t.regOther}
          </button>
        </div>
      ) : null}

      {mode === "pick" ? (
        <div className="space-y-3">
          <label htmlFor="reg-date" className="text-sm font-medium text-soft">
            {t.regPickLabel}
          </label>
          <input
            id="reg-date"
            type="date"
            value={day}
            max={today}
            onChange={(e) => setDay(e.target.value || today)}
            className="glass min-h-14 w-full rounded-[22px] px-5 font-display text-xl font-semibold outline-none [color-scheme:dark]"
          />
          <p className="text-sm text-muted first-letter:uppercase">
            {formatLong(day, lang)}
            {gap != null ? ` · ${t.regGap.replace("{n}", String(gap))}` : ""}
          </p>
          <button
            type="button"
            data-testid="reg-save"
            disabled={busy || !day || day > today}
            onClick={() => void save(day)}
            className="press flex h-14 w-full items-center justify-center rounded-full bg-grad text-base font-semibold text-primary-fg disabled:opacity-50"
          >
            {t.regSave}
          </button>
          <button
            type="button"
            onClick={() => setMode("ask")}
            className="press flex min-h-11 w-full items-center justify-center text-sm font-semibold text-muted"
          >
            {t.back}
          </button>
        </div>
      ) : null}

      {mode === "confirm" ? (
        <div className="space-y-3" data-testid="reg-confirm">
          <p className="text-[15px] leading-relaxed text-fg">
            {t.regShortBody.replace("{n}", String(gap ?? 0)).replace("{date}", formatLong(day, lang))}
          </p>
          <button
            type="button"
            data-testid="reg-confirm-yes"
            disabled={busy}
            onClick={() => void save(day, true)}
            className="press flex h-14 w-full items-center justify-center rounded-full bg-grad text-base font-semibold text-primary-fg disabled:opacity-60"
          >
            {t.regShortYes}
          </button>
          <button
            type="button"
            onClick={() => setMode("pick")}
            className="press glass flex h-12 w-full items-center justify-center rounded-full text-sm font-semibold"
          >
            {t.regShortChange}
          </button>
        </div>
      ) : null}
    </BottomSheet>
  );
}
