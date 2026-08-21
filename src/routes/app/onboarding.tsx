import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { PageTitle } from "@/components/color-blobs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loadToday, writeProfile } from "@/lib/savia-api";
import { requestNotify } from "@/lib/notify";
import { useI18n } from "@/lib/i18n";
import { pick, stageName } from "@/lib/savia-content";
import { STAGES, INTENTIONS, type Intention, type Stage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CYCLE_CHOICES, formatLong, nextPeriodDate } from "@/lib/cycle";
import { LATAM } from "@/lib/latam";

export const Route = createFileRoute("/app/onboarding")({ component: Onboarding });

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
  const cycling = stage === "cycle" || stage === "peri" || stage === "postpartum";
  const canSave = Boolean(displayName.trim()) && (!cycling || Boolean(lastPeriodStart));

  async function save() {
    const years = age ? Number(age) : NaN;
    const birthYear = Number.isFinite(years) && years >= 12 && years <= 80 ? new Date().getFullYear() - years : null;
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
    <AppShell current="mas">
      <PageTitle kicker={t.notebookNote} title={t.onboardingTitle} />
      <div className="mt-6 space-y-5 rounded-[1.6rem] bg-surface p-5 shadow-card">
        <div>
          <Label htmlFor="name">{t.yourName}</Label>
          <Input id="name" className="mt-1" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="age">{t.yourAge}</Label>
          <Input
            id="age"
            inputMode="numeric"
            className="mt-1"
            placeholder="32"
            value={age}
            onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 2))}
          />
        </div>
        <div>
          <p className="text-sm font-semibold">{t.yourCountry}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {LATAM.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => setCountry(c.code)}
                className={cn(
                  "h-11 rounded-full px-3 text-sm font-semibold",
                  country === c.code ? "bg-primary text-primary-fg" : "bg-bg text-fg",
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {STAGES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStage(s)}
              className={cn(
                "h-11 rounded-full px-4 text-sm font-semibold",
                stage === s ? "bg-primary text-primary-fg" : "bg-bg text-fg",
              )}
            >
              {pick(stageName[s], lang)}
            </button>
          ))}
        </div>
        {stage === "cycle" || stage === "peri" || stage === "postpartum" ? (
          <div>
            <p className="text-sm font-semibold">{t.intentTitle}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {INTENTIONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIntention(i)}
                  className={cn(
                    "h-11 rounded-full px-4 text-sm font-semibold",
                    intention === i ? "bg-primary text-primary-fg" : "bg-bg text-fg",
                  )}
                >
                  {i === "track" ? t.intentTrack : i === "avoid" ? t.intentAvoid : t.intentTtc}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {stage === "pregnancy" ? (
          <div>
            <Label htmlFor="due">{t.dueDate}</Label>
            <Input id="due" type="date" className="mt-1" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        ) : null}
        {stage === "meno" ? (
          <div>
            <Label htmlFor="lpy">{t.lastPeriodYear}</Label>
            <Input
              id="lpy"
              type="number"
              className="mt-1"
              value={lastPeriodYear}
              onChange={(e) => setLastPeriodYear(Number(e.target.value))}
            />
          </div>
        ) : null}
        {stage === "cycle" || stage === "peri" || stage === "postpartum" ? (
          <>
            <div>
              <Label htmlFor="lp">{t.lastPeriod}</Label>
              <Input
                id="lp"
                type="date"
                className="mt-1"
                value={lastPeriodStart}
                onChange={(e) => setLastPeriodStart(e.target.value)}
              />
            </div>
            <div>
              <Label>{t.cycleLength}</Label>
              <p className="mt-1 text-xs text-muted">{t.cycleHint}</p>
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
            </div>
            <div>
              <Label>{t.periodLength}</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {[3, 4, 5, 6, 7].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPeriodLength(n)}
                    className={cn(
                      "h-11 min-w-11 rounded-full px-3 text-sm font-bold",
                      periodLength === n ? "bg-accent text-ink" : "bg-bg text-fg",
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            {next ? (
              <div className="rounded-2xl bg-primary px-4 py-4 text-primary-fg shadow-card">
                <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{t.confirmDate}</p>
                <p className="mt-1 text-2xl font-extrabold">{formatLong(next, lang)}</p>
                <p className="mt-1 text-sm opacity-90">
                  {t.cycleLength}: {cycleLength}
                </p>
              </div>
            ) : null}
          </>
        ) : null}
        <Button type="button" className="w-full" onClick={() => void save()} disabled={busy || !canSave}>
          {next ? t.dateFits : t.save}
        </Button>
      </div>
    </AppShell>
  );
}
