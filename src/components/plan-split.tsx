import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

export function PlanSplit() {
  const { t } = useI18n();
  const free = [t.free1, t.free2, t.free3, t.free4];
  const paid = [t.paid1, t.paid2, t.paid3, t.paid4, t.paid5];
  return (
    <div className="mt-8 space-y-3">
      <section className="rounded-[1.5rem] bg-surface p-5 shadow-card">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">{t.freeLabel}</p>
        <p className="mt-1 font-display text-2xl font-semibold">{t.freeTitle}</p>
        <p className="mt-1 text-sm text-muted">{t.freePrice} · {t.freeNote}</p>
        <ul className="mt-3 space-y-2 text-sm leading-snug">
          {free.map((x) => (
            <li key={x}>· {x}</li>
          ))}
        </ul>
      </section>
      <section className="rounded-[1.5rem] bg-primary p-5 text-primary-fg shadow-card">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-80">{t.proName}</p>
        <p className="mt-1 font-display text-2xl font-semibold">{t.paidTitle}</p>
        <p className="mt-1 text-sm opacity-90">
          {t.proPrice} {t.proNote} · {t.yearPrice} {t.yearNote}
        </p>
        <ul className="mt-3 space-y-2 text-sm leading-snug">
          {paid.map((x) => (
            <li key={x}>· {x}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs opacity-80">{t.planSame}</p>
        <Link
          to="/pagar"
          className="mt-5 flex h-12 items-center justify-center rounded-full bg-surface text-sm font-semibold text-primary"
        >
          {t.payCta}
        </Link>
      </section>
    </div>
  );
}
