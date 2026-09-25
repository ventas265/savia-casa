import { useNavigate } from "@tanstack/react-router";
import { MessageCircleHeart, ShieldPlus } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { daysUntil, formatLong, todayISO } from "@/lib/cycle";

/** Days since `day` if it falls within the 5-day (120 h) window, else null. */
export function ecDaysSince(day: string, today = todayISO()): number | null {
  const d = daysUntil(day, today);
  if (d == null) return null;
  const since = -d;
  return since >= 0 && since <= 5 ? since : null;
}

/** Calm emergency-contraception info after unprotected sex on a fertile day. */
export function EmergencyCard({ day, onNavigate }: { day: string; onNavigate?: () => void }) {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const since = ecDaysSince(day);
  if (since == null) return null;
  const elapsed = since === 0 ? t.ecToday : since === 1 ? t.ecYesterday : t.ecDaysAgo.replace("{n}", String(since));
  return (
    <section
      data-testid="ec-card"
      role="note"
      className="card-fert mt-4 rounded-[20px] px-4 py-3.5"
      aria-label={t.ecKicker}
    >
      <p className="kicker flex items-center gap-1.5 !text-[#6FE0D2]">
        <ShieldPlus className="size-3.5" strokeWidth={1.8} aria-hidden />
        {t.ecKicker}
      </p>
      <p className="mt-1.5 font-display text-[16.5px] font-semibold leading-snug tracking-[-0.02em]">{t.ecTitle}</p>
      <p className="mt-1 text-[12.5px] leading-snug text-soft">
        {t.ecIntro} {elapsed}
      </p>
      <ul className="mt-2.5 space-y-1.5 text-[12.5px] leading-snug text-fg">
        {[t.ecPillLng, t.ecPillUpa, t.ecIud].map((line) => (
          <li key={line} className="flex gap-2">
            <span aria-hidden className="mt-[6px] size-1.5 shrink-0 rounded-full bg-cal-peak" />
            {line}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[12.5px] font-semibold leading-snug">{t.ecSooner}</p>
      <p className="mt-1 text-[12.5px] leading-snug text-soft">{t.ecWhere}</p>
      <button
        type="button"
        onClick={() => {
          onNavigate?.();
          void navigate({
            to: "/app/preguntar",
            search: { q: t.ecPrefill.replace("{date}", formatLong(day, lang)), ctx: "ec" },
          });
        }}
        className="press mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-white/[0.08] text-sm font-semibold ring-1 ring-white/15"
      >
        <MessageCircleHeart className="size-4" strokeWidth={1.8} aria-hidden />
        {t.ecAsk}
      </button>
      <p className="mt-2 text-[11px] leading-snug text-muted">{t.ecDisclaimer}</p>
    </section>
  );
}
