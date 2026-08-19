import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { writeProfile } from "@/lib/savia-api";
import { useI18n } from "@/lib/i18n";
import { pick, stageName } from "@/lib/savia-content";
import { STAGES, INTENTIONS, type Intention, type Stage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { todayISO } from "@/lib/cycle";

export const Route = createFileRoute("/app/onboarding")({ component: Onboarding });

function Onboarding() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [stage, setStage] = useState<Stage>("cycle");
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [lastPeriodStart, setLastPeriodStart] = useState(todayISO());
  const [dueDate, setDueDate] = useState("");
  const [lastPeriodYear, setLastPeriodYear] = useState(new Date().getFullYear() - 2);
  const [birthYear, setBirthYear] = useState<string>("");
  const [intention, setIntention] = useState<Intention>("track");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const res = await writeProfile({
          displayName,
          stage,
          birthYear: birthYear ? Number(birthYear) : null,
          cycleLength,
          periodLength,
          lastPeriodStart: stage === "meno" || stage === "pregnancy" ? null : lastPeriodStart || null,
          dueDate: stage === "pregnancy" ? dueDate || null : null,
          lastPeriodYear: stage === "meno" ? lastPeriodYear : null,
          onboardingDone: true,
          locale: lang,
          intention,
      });
      if (!res.ok) {
        toast.error(t.errorGeneric);
        return;
      }
      void navigate({ to: "/app/hoy" });
    } catch {
      toast.error(t.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell current="mas">
      <h1 className="text-2xl font-semibold">{t.onboardingTitle}</h1>
      <p className="mt-2 text-sm text-muted">{t.onboardingBody}</p>
      <div className="mt-6 space-y-5 rounded-3xl bg-surface p-5">
        <div>
          <Label htmlFor="name">{t.yourName}</Label>
          <Input id="name" className="mt-1" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          {STAGES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStage(s)}
              className={cn(
                "h-11 rounded-full px-4 text-sm",
                stage === s ? "bg-primary text-primary-fg" : "bg-bg text-fg",
              )}
            >
              {pick(stageName[s], lang)}
            </button>
          ))}
        </div>
        {stage === "cycle" || stage === "peri" || stage === "postpartum" ? (
          <div>
            <p className="text-sm font-medium">{t.intentTitle}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {INTENTIONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIntention(i)}
                  className={cn(
                    "h-11 rounded-full px-4 text-sm",
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="cl">{t.cycleLength}</Label>
                <Input
                  id="cl"
                  type="number"
                  className="mt-1"
                  value={cycleLength}
                  onChange={(e) => setCycleLength(Number(e.target.value) || 28)}
                />
              </div>
              <div>
                <Label htmlFor="pl">{t.periodLength}</Label>
                <Input
                  id="pl"
                  type="number"
                  className="mt-1"
                  value={periodLength}
                  onChange={(e) => setPeriodLength(Number(e.target.value) || 5)}
                />
              </div>
            </div>
          </>
        ) : null}
        <div>
          <Label htmlFor="by">{t.birthYear}</Label>
          <Input id="by" type="number" className="mt-1" value={birthYear} onChange={(e) => setBirthYear(e.target.value)} />
        </div>
        <Button type="button" className="w-full" onClick={() => void save()} disabled={busy}>
          {t.save}
        </Button>
      </div>
    </AppShell>
  );
}
