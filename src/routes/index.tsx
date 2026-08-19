import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { LangToggle } from "@/components/lang-toggle";
import { TabBar, type TabKey } from "@/components/tab-bar";
import { CycleCalendar } from "@/components/cycle-calendar";
import { Predictions } from "@/components/predictions";
import { FloToday } from "@/components/flo-today";
import { LibraryBody } from "@/components/library-body";
import { Shell } from "@/components/shell";
import { sampleLastStart, nextPeriodDate } from "@/lib/cycle";
import { SignedIn, SignedOut } from "@/lib/auth/gates";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { t } = useI18n();
  const [tab, setTab] = useState<TabKey>("hoy");
  const lastStart = sampleLastStart(24);
  const next = nextPeriodDate(lastStart, 28);

  return (
    <Shell
      header={
        <div className="flex h-14 items-center justify-between gap-3 px-4">
          <p className="text-lg font-semibold tracking-tight">{t.brand}</p>
          <div className="flex items-center gap-2">
            <LangToggle />
            <SignedOut>
              <Button size="sm" asChild>
                <Link to="/login">{t.start}</Link>
              </Button>
            </SignedOut>
            <SignedIn>
              <Button size="sm" asChild>
                <Link to="/app/hoy">{t.goApp}</Link>
              </Button>
            </SignedIn>
          </div>
        </div>
      }
      footer={<TabBar current={tab} onPick={setTab} />}
    >
      {tab === "cal" ? (
        <div className="rounded-3xl bg-surface p-4">
          <Predictions lastStart={lastStart} cycleLength={28} periodLength={5} starts={[lastStart]} intention="track" />
          <CycleCalendar lastStart={lastStart} cycleLength={28} periodLength={5} periodStarts={[lastStart]} />
        </div>
      ) : null}
      {tab === "hoy" ? (
        <FloToday
          stage="cycle"
          phase="luteal"
          nextPeriod={next}
          onCal={() => setTab("cal")}
          onLog={() => setTab("log")}
          onGuia={() => setTab("guia")}
        />
      ) : null}
      {tab === "log" ? (
        <div>
          <h1 className="text-2xl font-semibold">{t.logToday}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">{t.loginAfter}</p>
          <div className="mt-8 rounded-3xl bg-surface p-5">
            <p className="text-sm font-medium">{t.flow}</p>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {[t.flowSpot, t.flowLight, t.flowMed, t.flowHeavy].map((label) => (
                <div key={label} className="rounded-2xl border border-border py-5 text-center text-xs">
                  {label}
                </div>
              ))}
            </div>
            <Button className="mt-6 w-full" asChild>
              <Link to="/login">{t.start}</Link>
            </Button>
          </div>
        </div>
      ) : null}
      {tab === "guia" ? (
        <div>
          <h1 className="text-2xl font-semibold">{t.library}</h1>
          <div className="mt-6">
            <LibraryBody />
          </div>
        </div>
      ) : null}
      {tab === "mas" ? (
        <div>
          <h1 className="text-2xl font-semibold">{t.more}</h1>
          <ul className="mt-6 divide-y divide-border overflow-hidden rounded-3xl bg-surface">
            <li>
              <Link to="/pagar" className="flex min-h-14 items-center justify-between px-4 text-sm">
                {t.payCta}
                <ChevronRight className="size-4 text-muted" />
              </Link>
            </li>
            <li>
              <Link to="/pricing" className="flex min-h-14 items-center justify-between px-4 text-sm">
                {t.navPricing}
                <ChevronRight className="size-4 text-muted" />
              </Link>
            </li>
            <li>
              <a href="/?install=1" className="flex min-h-14 items-center justify-between px-4 text-sm">
                {t.installCta}
                <ChevronRight className="size-4 text-muted" />
              </a>
            </li>
          </ul>
          <p className="mt-6 text-sm leading-relaxed text-muted">{t.installBody}</p>
        </div>
      ) : null}
    </Shell>
  );
}
