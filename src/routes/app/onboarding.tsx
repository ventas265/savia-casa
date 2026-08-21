import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loadToday, writeProfile } from "@/lib/savia-api";
import { localReset } from "@/lib/savia-local";
import { requestNotify } from "@/lib/notify";
import { useI18n } from "@/lib/i18n";
import { pick, stageName } from "@/lib/savia-content";
import { STAGES, INTENTIONS, type Intention, type Stage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CYCLE_CHOICES, daysUntil, formatLong, nextPeriodDate } from "@/lib/cycle";
import { LATAM } from "@/lib/latam";

export const Route = createFileRoute("/app/onboarding")({ component: Onboarding });

function Block({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-[1.4rem] bg-surface p-5 shadow-card">
      <h2 className="text-base font-bold">{title}</h2>
      {hint ? <p className="mt-1 text-sm leading-relaxed text-muted">{hint}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Onboarding() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [age, setAge] = useState("");
  const [stage, setStage] = useState<Stage>("cycle");
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [lastPeriodStart, setLastPeriodStart] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [lastPeriodYear, setLastPeriodYear] = useState(new Date().getFullYear() - 2);
  const [intention, setIntention] = useState<Intention>("track");
  const [country, setCountry] = useState("VE");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void loadToday().then((snap) => {
      const p = snap.profile;
      if (p.displayName) setDisplayName(p.displayName);
      if (p.birthYear) setAge(String(new Date().getFullYear() - p.birthYear));
      if (p.stage) setStage(p.stage);
      if (p.cycleLength) setCycleLength(p.cycleLength);
      if (p.periodLength) setPeriodLength(p.periodLength);
      if (p.lastPeriodStart) setLastPeriodStart(p.lastPeriodStart);
      if (p.dueDate) setDueDate(p.dueDate);
      if (p.intention) setIntention(p.intention);
      if (p.country) setCountry(p.country);
    });
  }, []);

  const next = useMemo(
    () => (lastPeriodStart ? nextPeriodDate(lastPeriodStart, cycleLength) : null),
    [lastPeriodStart, cycleLength],
  );
  const left = daysUntil(next);
  const cycling = stage === "cycle" || stage === "peri" || stage === "postpartum";
  const ageN = Number(age);
  const ageOk = Number.isFinite(ageN) && ageN >= 12 && ageN <= 80;
  const canSave = Boolean(displayName.trim()) && ageOk && (!cycling || Boolean(lastPeriodStart));

  async function save() {
    const birthYear = ageOk ? new Date().getFullYear() - ageN : null;
    setBusy(true);
    try {
      const res = await writeProfile({
        displayName,
        stage,
        birthYear,
        cycleLength,
        periodLength,
        lastPeriodStart: stage === "meno" || stage === "pregnancy" ? null : lastPeriodStart || null,
        dueDate: stage === "pregnancy" ? dueDate || null : null,
        lastPeriodYear: stage === "meno" ? lastPeriodYear : null,
        onboardingDone: true,
        locale: lang,
        intention,
        country,
      });
      if (!res.ok) {
        toast.error(t.errorGeneric);
        return;
      }
      toast.success(t.notebookNote);
      void requestNotify();
      void navigate({ to: "/app/hoy" });
    } catch {
      toast.error(t.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 pb-8">
      <div>
        <p className="text-sm font-semibold text-primary">{t.brand}</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">{t.onboardingTitle}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">{t.onboardingBody}</p>
      </div>

      <Block title={t.yourName}>
        <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        <Label htmlFor="age" className="mt-4 block">
          {t.yourAge}
        </Label>
        <p className="mt-1 text-xs text-muted">{t.ageHint}</p>
        <Input
          id="age"
          inputMode="numeric"
          className="mt-2"
          placeholder="32"
          value={age}
          onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 2))}
        />
        {ageOk ? (
          <p className="mt-2 text-sm font-semibold">
            {t.youAre} {ageN} {t.yearsOld}
          </p>
        ) : null}
      </Block>

      <Block title={t.yourCountry}>
        <select
          id="country"
          className="h-12 w-full rounded-2xl border-0 bg-bg px-4 text-sm font-semibold"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        >
          {LATAM.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </Block>

      <Block title={t.stageAsk} hint={t.stageHint}>
        <div className="space-y-2">
          {STAGES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStage(s)}
              className={cn(
                "flex min-h-12 w-full items-center rounded-2xl px-4 text-left text-sm font-semibold",
                stage === s ? "bg-primary text-primary-fg" : "bg-bg text-fg",
              )}
            >
              {pick(stageName[s], lang)}
            </button>
          ))}
        </div>
      </Block>

      {stage === "cycle" || stage === "peri" || stage === "postpartum" ? (
        <Block title={t.intentTitle}>
          <div className="space-y-2">
            {INTENTIONS.map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIntention(i)}
                className={cn(
                  "flex min-h-12 w-full items-center rounded-2xl px-4 text-left text-sm font-semibold",
                  intention === i ? "bg-primary text-primary-fg" : "bg-bg text-fg",
                )}
              >
                {i === "track" ? t.intentTrack : i === "avoid" ? t.intentAvoid : t.intentTtc}
              </button>
            ))}
          </div>
        </Block>
      ) : null}

      {stage === "pregnancy" ? (
        <Block title={t.dueDate}>
          <Input id="due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Block>
      ) : null}

      {stage === "meno" ? (
        <Block title={t.lastPeriodYear}>
          <Input
            id="lpy"
            type="number"
            value={lastPeriodYear}
            onChange={(e) => setLastPeriodYear(Number(e.target.value))}
          />
        </Block>
      ) : null}

      {cycling ? (
        <Block title={t.lastPeriod} hint={t.cycleHint}>
          <Input
            id="lp"
            type="date"
            value={lastPeriodStart}
            onChange={(e) => setLastPeriodStart(e.target.value)}
          />
          <p className="mt-4 text-sm font-semibold">{t.cycleLength}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {CYCLE_CHOICES.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setCycleLength(n)}
                className={cn(
                  "h-11 min-w-11 rounded-full px-3 text-sm font-bold",
                  cycleLength === n ? "bg-primary text-primary-fg" : "bg-bg text-fg",
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="mt-4 text-sm font-semibold">{t.periodLength}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {[3, 4, 5, 6, 7].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPeriodLength(n)}
                className={cn(
                  "h-11 min-w-11 rounded-full px-3 text-sm font-bold",
                  periodLength === n ? "bg-primary/20 text-fg" : "bg-bg text-fg",
                )}
              >
                {n}
              </button>
            ))}
          </div>
          {next && left != null ? (
            <div className="mt-5 rounded-2xl bg-primary px-4 py-4 text-primary-fg">
              <p className="text-sm font-semibold opacity-90">{t.periodBeginsIn}</p>
              <p className="mt-1 text-3xl font-extrabold">
                {left} {left === 1 ? t.dayLeft : t.daysLeft}
              </p>
              <p className="mt-1 text-sm opacity-90">{formatLong(next, lang)}</p>
            </div>
          ) : null}
        </Block>
      ) : null}

      <Button type="button" className="w-full" onClick={() => void save()} disabled={busy || !canSave}>
        {next ? t.dateFits : t.save}
      </Button>
      <button
        type="button"
        className="w-full text-center text-xs text-muted underline-offset-4 hover:underline"
        onClick={() => {
          localReset();
          setDisplayName("");
          setAge("");
          setStage("cycle");
          setCycleLength(28);
          setPeriodLength(5);
          setLastPeriodStart("");
          setIntention("track");
          toast.success(t.resetNotebook);
        }}
      >
        {t.resetNotebook}
      </button>
    </div>
  );
}
