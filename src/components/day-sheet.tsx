import { useEffect } from "react";
import { X } from "lucide-react";
import { LogForm } from "@/components/log-form";
import { useI18n } from "@/lib/i18n";
import { formatDay } from "@/lib/cycle";
import type { DailyLog } from "@/lib/types";

export function DaySheet({
  day,
  log,
  paid = false,
  onClose,
  onSaved,
}: {
  day: string;
  log: DailyLog | null;
  paid?: boolean;
  onClose: () => void;
  onSaved?: (log: DailyLog) => void;
}) {
  const { t, lang } = useI18n();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={t.daySheet}>
      <button type="button" className="absolute inset-0 bg-ink/40" aria-label={t.close} onClick={onClose} />
      <div className="relative z-10 flex max-h-[88vh] w-full max-w-lg flex-col rounded-t-[1.75rem] bg-bg shadow-card sm:rounded-[1.75rem]">
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 pb-3 pt-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t.daySheet}</p>
            <p className="mt-1 font-display text-xl font-semibold tracking-[-0.03em]">{formatDay(day, lang)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="press inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-surface shadow-card"
            aria-label={t.close}
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 pb-10">
          {!log ? <p className="mb-4 text-sm leading-relaxed text-muted">{t.daySheetEmpty}</p> : null}
          <LogForm key={day} day={day} initial={log} paid={paid} onSaved={onSaved} />
        </div>
      </div>
    </div>
  );
}
