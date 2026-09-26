import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
import { useSerenaSheet } from "@/lib/serena-sheet";
import { fill, useV4 } from "@/lib/i18n-v4";
import { PRICES } from "@/lib/v4-content";

/** 06 · Serena — full-height modal over the current screen. Real prices: $4.99/mes, $39/año. */
export function SerenaSheet() {
  const { open, hide } = useSerenaSheet();
  if (!open) return null;
  return <SerenaModal onClose={hide} />;
}

function SerenaModal({ onClose }: { onClose: () => void }) {
  const { v } = useV4();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<"year" | "month">("year");
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const feats = [v.serenaF1, v.serenaF2, v.serenaF3, v.serenaF4];
  return (
    <div
      className="fixed inset-0 z-[60] flex justify-center bg-[rgb(43_33_36/0.5)]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="serena-title"
      data-testid="serena-sheet"
    >
      <div className="relative h-dvh w-full max-w-lg overflow-y-auto bg-bg md:max-w-[28rem]">
        <div className="relative h-[440px]">
          <img src="/v4/serena.webp" alt="" className="size-full object-cover" style={{ objectPosition: "50% 30%" }} />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(rgba(0,0,0,.22),rgba(0,0,0,0) 22%,rgba(246,241,236,0) 60%,#f6f1ec 100%)" }}
          />
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={v.close}
            className="absolute right-4 top-[max(16px,env(safe-area-inset-top))] grid size-12 place-items-center rounded-full bg-white/85 text-ink"
          >
            <X className="size-5" strokeWidth={1.8} />
          </button>
        </div>
        <div className="relative -mt-[68px] px-[22px] pb-[calc(24px+env(safe-area-inset-bottom))]">
          <p className="v4-eyebrow acc">{v.serenaKicker}</p>
          <h2 id="serena-title" className="v4-h1 mb-3.5 mt-2 !text-[40px]">
            {v.serenaTitle}
          </h2>
          <ul className="flex flex-col gap-[9px]">
            {feats.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-[15px] font-medium leading-tight text-ink-2">
                <Check className="size-4 shrink-0 text-accent" strokeWidth={2.2} aria-hidden />
                {f}
              </li>
            ))}
          </ul>
          <div className="mb-3.5 mt-[18px] flex gap-2.5">
            <button
              type="button"
              className="v4-plan"
              aria-pressed={plan === "year"}
              onClick={() => setPlan("year")}
              data-plan="year"
            >
              <span className="v4-save">{PRICES.save}</span>
              <span className="v4-rad" aria-hidden>
                {plan === "year" ? <Check className="size-3 text-white" strokeWidth={3} /> : null}
              </span>
              <span className="text-[13.5px] font-semibold text-ink-2">{v.annual}</span>
              <b>{PRICES.year}</b>
              <small className="text-[13px] font-medium text-muted">{fill(v.yearPerMonth, { p: PRICES.yearPerMonth })}</small>
            </button>
            <button
              type="button"
              className="v4-plan"
              aria-pressed={plan === "month"}
              onClick={() => setPlan("month")}
              data-plan="month"
            >
              <span className="v4-rad" aria-hidden>
                {plan === "month" ? <Check className="size-3 text-white" strokeWidth={3} /> : null}
              </span>
              <span className="text-[13.5px] font-semibold text-ink-2">{v.monthly}</span>
              <b>{PRICES.month}</b>
              <small className="text-[13px] font-medium text-muted">{v.perMonth}</small>
            </button>
          </div>
          <button
            type="button"
            className="v4-cta"
            data-testid="serena-cta"
            onClick={() => {
              onClose();
              void navigate({ to: "/pagar", search: { plan: plan === "year" ? "year" : "serena" } });
            }}
          >
            {v.serenaCta}
          </button>
          <p className="mt-3 text-center text-[12.5px] font-medium leading-snug text-muted">{v.serenaFine}</p>
        </div>
      </div>
    </div>
  );
}
