import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

/** Nocturna bottom sheet: slides up over the tab bar, Esc / backdrop closes. */
export function BottomSheet({
  title,
  kicker,
  onClose,
  children,
  testId,
  labelledBy = "sheet-title",
}: {
  title: ReactNode;
  kicker?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  testId?: string;
  labelledBy?: string;
}) {
  const { t } = useI18n();
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      data-testid={testId}
    >
      <button
        type="button"
        className={cn(
          "absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-300",
          shown ? "opacity-100" : "opacity-0",
        )}
        aria-label={t.close}
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 flex max-h-[88dvh] w-full max-w-lg flex-col rounded-t-[1.75rem] border-t border-white/10 bg-elevated shadow-bar transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          shown ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-white/20" aria-hidden />
        <div className="flex items-start justify-between gap-3 px-5 pt-3">
          <div className="min-w-0">
            {kicker ? <p className="kicker !text-label">{kicker}</p> : null}
            <h2 id={labelledBy} className="mt-1 font-display text-[1.5rem] font-semibold leading-tight tracking-[-0.035em]">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="press inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-muted ring-1 ring-white/10"
            aria-label={t.close}
          >
            <X className="size-5" strokeWidth={1.5} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3">{children}</div>
      </div>
    </div>
  );
}
