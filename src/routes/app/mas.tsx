import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, BookOpen, ChevronRight, Copy, FileText, MessageCircle, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { PageTitle } from "@/components/color-blobs";
import { PlanSplit } from "@/components/plan-split";
import { Disclaimer } from "@/components/disclaimer";
import { notifyPermission } from "@/lib/notify";
import { enableReminders } from "@/lib/reminders";
import { emptyPay, getAskStatus, getPay, type PaySettings } from "@/lib/savia-server";
import { loadToday } from "@/lib/savia-api";
import { SAVIA_BETA } from "@/lib/beta";
import { localToday } from "@/lib/savia-local";
import { pick, stageName } from "@/lib/savia-content";
import { latamOf } from "@/lib/latam";
import type { SaviaProfile } from "@/lib/types";
import { InstallSavia } from "@/components/install-savia";
import { PushReminders } from "@/components/push-reminders";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/mas")({ component: MasTab });

function MasTab() {
  const { t, lang } = useI18n();
  // Client-only storage is read in effects, never during render (SSR hydration #418).
  const [perm, setPerm] = useState<string>("default");
  const [profile, setProfile] = useState<SaviaProfile | null>(null);
  const [pay, setPay] = useState<PaySettings>(emptyPay);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    setPerm(notifyPermission());
    if (SAVIA_BETA) {
      const p = localToday().profile;
      setProfile(p);
      setPaid(p.plan === "serena" || p.plan === "year");
    }
    loadToday()
      .then((s) => {
        setProfile(s.profile);
        if (s.profile.plan === "serena" || s.profile.plan === "year") setPaid(true);
      })
      .catch(() => setProfile(null));
    getPay()
      .then(setPay)
      .catch(() => {});
    if (!SAVIA_BETA) {
      getAskStatus()
        .then((s) => setPaid(s.paid))
        .catch(() => setPaid(false));
    }
  }, []);

  async function copy(text: string) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t.copied);
    } catch {
      toast.error(t.errorGeneric);
    }
  }

  const country = latamOf(profile?.country).name;
  const age = profile?.birthYear ? new Date().getFullYear() - profile.birthYear : null;
  const pmLine = pay ? [pay.pmBank, pay.pmPhone, pay.pmId].filter(Boolean).join(" · ") : "";

  return (
    <>
      <PageTitle title={t.more} />
      <div className="mt-4">
        <InstallSavia />
      </div>
      <PushReminders />
      {paid ? null : <PlanSplit />}

      <section className="mt-6 rounded-[1.6rem] bg-surface p-5 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t.moreYou}</p>
        {profile?.displayName ? (
          <>
            <p className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em]">{profile.displayName}</p>
            <p className="mt-1 text-sm text-muted">
              {pick(stageName[profile.stage], lang)}
              {age ? ` · ${age}` : ""}
              {profile.stage === "cycle" || profile.stage === "peri" ? ` · ${profile.cycleLength} ${t.days}` : ""}
              {` · ${country}`}
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted">{t.moreBlank}</p>
        )}
        <Link
          to="/app/onboarding"
        className="press mt-4 flex min-h-12 items-center justify-between rounded-full bg-grad px-4 text-sm font-semibold text-primary-fg"
        >
          {t.profile}
          <ChevronRight className="size-4" />
        </Link>
        <Link
          to="/app/recuperar"
          className="press mt-2 flex min-h-12 items-center justify-between rounded-full bg-bg px-4 text-sm font-semibold"
        >
          {t.recoverTitle}
          <ChevronRight className="size-4" />
        </Link>
      </section>


      <section className="mt-4 rounded-[1.6rem] bg-surface p-5 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t.intentTitle}</p>
        <div className="mt-3 rounded-[1.25rem] bg-bg px-4 py-3">
          <p className="text-sm font-semibold">{t.fertilityToggle}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">{t.fertilityToggleHint}</p>
        </div>
      </section>

      <section className="mt-4 rounded-[1.6rem] card-hot p-5">
        <p className="text-sm opacity-70">{t.proName}</p>
        <p className="mt-1 text-xl font-extrabold">{paid ? t.serenaActive : t.proPrice}</p>
        {!paid ? (
          <Button className="mt-4 w-full" asChild>
            <Link to="/pagar">{t.payCta}</Link>
          </Button>
        ) : (
          <Link to="/app/preguntar" className="mt-4 inline-flex min-h-12 items-center font-semibold text-accent">
            {t.askTalk}
          </Link>
        )}
      </section>

      {paid ? null : (
      <section className="mt-6">
        <h2 className="text-lg font-bold">{t.morePay}</h2>
        <p className="mt-1 text-sm text-muted">{t.morePayHint}</p>
        <ul className="mt-3 space-y-2">
          <PayRow label={t.payIdCard} value="$4.99 · $39" onCopy={() => void copy("$4.99")} to="/pagar" />
          {pay?.paypalEmail ? (
            <PayRow label={t.payIdPaypal} value={pay.paypalEmail} onCopy={() => void copy(pay.paypalEmail)} />
          ) : null}
          {pay?.binance ? (
            <PayRow label={t.payIdBinance} value={pay.binance} onCopy={() => void copy(pay.binance)} />
          ) : null}
          {pmLine ? <PayRow label={t.payIdPm} value={pmLine} onCopy={() => void copy(pmLine)} /> : null}
        </ul>
      </section>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-bold">{t.moreTools}</h2>
        <ul className="mt-3 space-y-2">
          <Tool to="/app/preguntar" label={t.askTalk} icon={MessageCircle} />
          <Tool to="/app/guia" label={t.library} icon={BookOpen} />
          <Tool to="/app/pareja" label={t.partnerTitle} icon={UserRound} />
          <Tool to="/app/informe" label={t.reportTitle} icon={FileText} />
          <Tool to="/app/onboarding" label={t.profile} icon={UserRound} />
        </ul>
        <button
          type="button"
          className="mt-2 flex min-h-14 w-full items-center justify-between rounded-[1.25rem] bg-surface px-4 text-left text-sm font-semibold shadow-card"
          onClick={() => {
            void enableReminders().then((p) => {
              setPerm(p);
              if (p === "granted") toast.success(t.notifyOn);
            });
          }}
        >
          <span className="flex items-center gap-3">
            <Bell className="size-5 text-primary" />
            {perm === "granted" ? t.notifyOn : t.notifyCta}
          </span>
          <ChevronRight className="size-4 text-muted" />
        </button>
        <a
          href="/?install=1"
          className="mt-2 flex min-h-14 items-center justify-between rounded-[1.25rem] bg-surface px-4 text-sm font-semibold shadow-card"
        >
          {t.installCta}
          <ChevronRight className="size-4 opacity-70" />
        </a>
      </section>

      <p className="mt-8 text-sm leading-relaxed text-muted">{t.privacyNote}</p>
      <div className="mt-3 flex gap-4 text-sm font-semibold text-primary">
        <Link to="/privacidad">{t.navPrivacy}</Link>
        <Link to="/terminos">{t.navTerms}</Link>
      </div>
      <div className="mt-8">
        <Disclaimer compact />
      </div>
    </>
  );
}

function PayRow({
  label,
  value,
  onCopy,
  to,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  to?: "/pagar";
}) {
  const inner = (
    <>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 break-all text-sm font-semibold">{value}</p>
    </>
  );
  return (
    <li className="flex items-center gap-2 rounded-[1.25rem] bg-surface p-4 shadow-card">
      {to ? (
        <Link to={to} className="min-w-0 flex-1">
          {inner}
        </Link>
      ) : (
        <div className="min-w-0 flex-1">{inner}</div>
      )}
      <button
        type="button"
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
        onClick={onCopy}
        aria-label={label}
      >
        <Copy className="size-4" />
      </button>
    </li>
  );
}

function Tool({
  to,
  label,
  icon: Icon,
}: {
  to: "/app/preguntar" | "/app/guia" | "/app/informe" | "/app/onboarding" | "/app/pareja";
  label: string;
  icon: typeof UserRound;
}) {
  return (
    <li>
      <Link
        to={to}
        className="press flex min-h-14 items-center justify-between rounded-[1.25rem] bg-surface px-4 text-sm font-semibold shadow-card"
      >
        <span className="flex items-center gap-3">
          <Icon className="size-5 text-primary" />
          {label}
        </span>
        <ChevronRight className="size-4 text-muted" />
      </Link>
    </li>
  );
}
