import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpen, ChevronRight, FileText, Heart, KeyRound, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { PageTitle } from "@/components/color-blobs";
import { Disclaimer } from "@/components/disclaimer";
import { getAskStatus } from "@/lib/savia-server";
import { loadToday } from "@/lib/savia-api";
import { SAVIA_BETA } from "@/lib/beta";
import { localToday } from "@/lib/savia-local";
import { pick, stageName } from "@/lib/savia-content";
import { latamOf } from "@/lib/latam";
import type { SaviaProfile } from "@/lib/types";
import { InstallSavia } from "@/components/install-savia";
import { PushReminders } from "@/components/push-reminders";
import { DeleteMyData } from "@/components/delete-my-data";

export const Route = createFileRoute("/app/tu")({ component: TuTab });

type ToolTo = "/app/sexo" | "/app/guia" | "/app/pareja" | "/app/informe" | "/app/recuperar" | "/app/onboarding";

function TuTab() {
  const { t, lang } = useI18n();
  // Client-only storage is read in effects, never during render (SSR hydration #418).
  const [profile, setProfile] = useState<SaviaProfile | null>(null);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (SAVIA_BETA) {
      const p = localToday().profile;
      setProfile(p);
      setPaid(p.plan === "serena" || p.plan === "year");
    }
    loadToday()
      .then((s) => {
        setProfile(s.profile);
        setPaid(s.profile.plan === "serena" || s.profile.plan === "year");
      })
      .catch(() => {});
    if (!SAVIA_BETA) {
      getAskStatus()
        .then((s) => setPaid(s.paid))
        .catch(() => setPaid(false));
    }
  }, []);

  // Bell on Hoy / soft prompt land on the reminders card.
  useEffect(() => {
    if (window.location.hash !== "#recordatorios") return;
    const id = window.setTimeout(() => document.getElementById("recordatorios")?.scrollIntoView({ block: "start" }), 150);
    return () => window.clearTimeout(id);
  }, []);

  const country = profile?.country ? latamOf(profile.country).name : "";
  const age = profile?.birthYear ? new Date().getFullYear() - profile.birthYear : null;
  const cycling = profile?.stage === "cycle" || profile?.stage === "peri";

  return (
    <>
      <PageTitle title={t.navYou} />

      {/* Plan as a banner: one consistent state (active ⇒ never offers to pay). */}
      {paid ? (
        <div data-testid="plan-banner" data-plan="serena" className="card-hot mt-4 flex items-center gap-3 rounded-[22px] px-4 py-3.5">
          <Sparkles className="size-5 shrink-0" strokeWidth={1.7} aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="font-display text-[16px] font-semibold tracking-[-0.02em]">{t.tuPlanActive}</p>
            <p className="text-[12.5px] opacity-80">{t.tuPlanActiveSub}</p>
          </div>
        </div>
      ) : (
        <Link
          to="/pagar"
          data-testid="plan-banner"
          data-plan="free"
          className="press mt-4 flex min-h-14 items-center gap-3 rounded-[22px] border border-[rgb(242_66_126/0.35)] bg-[linear-gradient(135deg,rgb(242_66_126/0.18),rgb(182_92_255/0.14))] px-4 py-3.5"
        >
          <Sparkles className="size-5 shrink-0 text-[#ffb0cc]" strokeWidth={1.7} aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="font-display text-[16px] font-semibold tracking-[-0.02em]">{t.tuPlanFree}</p>
            <p className="text-[12.5px] text-soft">{t.tuPlanFreeSub}</p>
          </div>
          <ChevronRight className="size-4 text-muted" aria-hidden />
        </Link>
      )}

      <section className="glass mt-4 rounded-[22px] p-5" data-testid="tu-perfil" aria-labelledby="tu-perfil-h">
        <p id="tu-perfil-h" className="kicker">{t.tuProfile}</p>
        {profile?.displayName ? (
          <>
            <p className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em]">{profile.displayName}</p>
            <p className="mt-1 text-sm text-muted">
              {[
                pick(stageName[profile.stage], lang),
                age ? String(age) : "",
                cycling ? t.tuCycleLen.replace("{n}", String(profile.cycleLength)) : "",
                cycling ? t.tuPeriodLen.replace("{n}", String(profile.periodLength)) : "",
                country,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted">{t.moreBlank}</p>
        )}
        <Link
          to="/app/onboarding"
          className="press mt-4 flex min-h-12 items-center justify-between rounded-full bg-grad px-4 text-sm font-semibold text-primary-fg"
        >
          {t.tuEditProfile}
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      </section>

      <PushReminders />

      <section className="mt-6" aria-labelledby="tu-guias-h">
        <h2 id="tu-guias-h" className="kicker px-1">{t.tuGuides}</h2>
        <ul className="mt-2 space-y-2">
          <Tool to="/app/sexo" label={t.tuSexGuide} icon={Heart} testId="tu-sexo" />
          <Tool to="/app/guia" label={t.library} icon={BookOpen} />
          <Tool to="/app/pareja" label={t.partnerTitle} icon={UserRound} />
          <Tool to="/app/informe" label={t.reportTitle} icon={FileText} />
        </ul>
      </section>

      <section className="glass mt-6 rounded-[22px] p-5" aria-labelledby="tu-priv-h" data-testid="tu-privacidad">
        <p id="tu-priv-h" className="flex items-center gap-2 kicker">
          <ShieldCheck className="size-4" strokeWidth={1.7} aria-hidden />
          {t.tuPrivacy}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-soft">{t.privacyNote}</p>
        <div className="mt-2 flex gap-4 text-sm font-semibold text-rose-dust">
          <Link to="/privacidad" className="inline-flex min-h-11 items-center">
            {t.navPrivacy}
          </Link>
          <Link to="/terminos" className="inline-flex min-h-11 items-center">
            {t.navTerms}
          </Link>
        </div>
        <DeleteMyData />
      </section>

      <section className="glass mt-4 rounded-[22px] p-5" aria-labelledby="tu-code-h" data-testid="tu-codigo">
        <p id="tu-code-h" className="flex items-center gap-2 kicker">
          <KeyRound className="size-4" strokeWidth={1.7} aria-hidden />
          {t.tuRecoveryCode}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-soft">{t.tuRecoveryBody}</p>
        <Link
          to="/app/recuperar"
          className="press mt-3 flex min-h-12 items-center justify-between rounded-full bg-white/[0.06] px-4 text-sm font-semibold ring-1 ring-white/10"
        >
          {t.recoverTitle}
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      </section>

      <div className="mt-4">
        <InstallSavia />
      </div>
      <div className="mt-8">
        <Disclaimer compact />
      </div>
    </>
  );
}

function Tool({ to, label, icon: Icon, testId }: { to: ToolTo; label: string; icon: typeof UserRound; testId?: string }) {
  return (
    <li>
      <Link
        to={to}
        data-testid={testId}
        className="press glass flex min-h-14 items-center justify-between rounded-[20px] px-4 text-sm font-semibold"
      >
        <span className="flex items-center gap-3">
          <Icon className="size-5 text-[#ffb0cc]" strokeWidth={1.7} aria-hidden />
          {label}
        </span>
        <ChevronRight className="size-4 text-muted" aria-hidden />
      </Link>
    </li>
  );
}
