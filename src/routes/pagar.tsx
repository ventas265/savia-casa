import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/site-header";
import { claimSerena, getAskStatus, getPay, type PaySettings } from "@/lib/savia-server";
import { Disclaimer } from "@/components/disclaimer";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/pagar")({ component: Pagar });

type Method = "zinli" | "pm" | "usdt" | "card";

function Pagar() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState<"serena" | "year">("serena");
  const [method, setMethod] = useState<Method>("zinli");
  const [pay, setPay] = useState<PaySettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState(false);
  const amount = plan === "year" ? "$39" : "$4.99";

  useEffect(() => {
    getPay()
      .then(setPay)
      .catch(() => setPay(null));
  }, []);

  useEffect(() => {
    if (user?.primaryEmail && !email) setEmail(user.primaryEmail);
  }, [user, email]);

  useEffect(() => {
    if (!user) return;
    getAskStatus()
      .then((s) => setActive(s.paid))
      .catch(() => setActive(false));
  }, [user]);

  const ready =
    method === "zinli"
      ? Boolean(pay?.zinli)
      : method === "pm"
        ? Boolean(pay?.pmPhone)
        : method === "usdt"
          ? Boolean(pay?.usdt)
          : Boolean(pay?.zinli || pay?.cardUrl);

  async function copy(text: string) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t.zinliCopy);
    } catch {
      toast.error(t.errorGeneric);
    }
  }

  async function paid(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      toast.error(t.payNeedLogin);
      void navigate({ to: "/login" });
      return;
    }
    setBusy(true);
    try {
      const note = `${method} ${pay?.zinli || pay?.pmPhone || pay?.usdt || pay?.cardUrl || ""}`;
      const res = await claimSerena({ data: { email, plan, note } });
      if (res.ok) {
        setActive(true);
        toast.success(t.zinliPaidOk);
        void navigate({ to: "/app/hoy" });
      } else toast.error(t.waitlistErr);
    } catch {
      toast.error(t.payNeedLogin);
      void navigate({ to: "/login" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh bg-bg">
      <SiteHeader />
      <main className="mx-auto max-w-lg px-4 py-8">
        <h1 className="text-2xl font-semibold">{t.payTitle}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">{t.payAuto}</p>
        {active ? <p className="mt-3 text-sm font-medium">{t.serenaActive}</p> : null}
        {!isPending && !user ? (
          <Button className="mt-4" asChild>
            <Link to="/login">{t.payNeedLogin}</Link>
          </Button>
        ) : null}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => setPlan("serena")}
            className={`flex-1 rounded-3xl p-4 text-left ${plan === "serena" ? "bg-surface ring-2 ring-primary" : "bg-surface"}`}
          >
            <p className="text-sm text-muted">{t.proName}</p>
            <p className="mt-1 text-3xl font-bold">{t.proPrice}</p>
            <p className="text-sm text-muted">{t.proNote}</p>
          </button>
          <button
            type="button"
            onClick={() => setPlan("year")}
            className={`flex-1 rounded-3xl p-4 text-left ${plan === "year" ? "bg-surface ring-2 ring-primary" : "bg-surface"}`}
          >
            <p className="text-sm text-muted">{t.yearName}</p>
            <p className="mt-1 text-3xl font-bold">{t.yearPrice}</p>
            <p className="text-sm text-muted">{t.yearNote}</p>
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {(
            [
              ["zinli", t.methodZinli],
              ["card", t.methodCard],
              ["pm", t.methodPm],
              ["usdt", t.methodUsdt],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setMethod(key)}
              className={`min-h-14 rounded-2xl px-2 text-xs font-medium ${method === key ? "bg-primary text-primary-fg" : "bg-surface text-fg"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-3xl bg-surface p-5">
          <p className="text-sm">
            {t.zinliAmount}: <span className="font-medium">{amount}</span>
          </p>
          <p className="text-sm text-muted">{t.zinliConcept}</p>
          {method === "zinli" ? (
            pay?.zinli ? (
              <p className="mt-3 text-3xl font-bold">@{pay.zinli}</p>
            ) : (
              <p className="mt-3 text-sm text-muted">{t.zinliNeed}</p>
            )
          ) : null}
          {method === "pm" ? (
            pay?.pmPhone ? (
              <div className="mt-3 space-y-1 text-sm">
                <p>{t.pmPhone}: {pay.pmPhone}</p>
                <p>{t.pmBank}: {pay.pmBank}</p>
                <p>{t.pmId}: {pay.pmId}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">{t.zinliNeed}</p>
            )
          ) : null}
          {method === "usdt" ? (
            pay?.usdt ? (
              <p className="mt-3 break-all text-sm">{pay.usdt}</p>
            ) : (
              <p className="mt-3 text-sm text-muted">{t.zinliNeed}</p>
            )
          ) : null}
          {method === "card" ? (
            <div className="mt-3 space-y-2">
              <p className="text-sm leading-relaxed">{t.cardBody}</p>
              {pay?.zinli ? <p className="text-xl font-bold">@{pay.zinli}</p> : null}
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={!ready}
              onClick={() =>
                void copy(
                  method === "zinli" || method === "card"
                    ? pay?.zinli || ""
                    : method === "pm"
                      ? pay?.pmPhone || ""
                      : pay?.usdt || "",
                )
              }
            >
              {t.zinliCopy}
            </Button>
            {method === "zinli" || method === "card" ? (
              <Button type="button" asChild>
                <a href="https://www.zinli.com/" target="_blank" rel="noreferrer">
                  {t.zinliOpen}
                </a>
              </Button>
            ) : null}
            {method === "card" && pay?.cardUrl ? (
              <Button type="button" asChild>
                <a href={pay.cardUrl} target="_blank" rel="noreferrer">
                  {t.cardOpen}
                </a>
              </Button>
            ) : null}
          </div>
        </div>

        <form className="mt-6 space-y-3" onSubmit={(e) => void paid(e)}>
          <label className="text-sm font-medium" htmlFor="pay-email">
            {t.emailWait}
          </label>
          <Input
            id="pay-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
          />
          <Button type="submit" className="w-full" disabled={busy || !ready}>
            {t.zinliPaid}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm">
          <Link to="/app/cuaderno" className="text-muted underline">
            {t.zinliSave}
          </Link>
        </p>
        <div className="mt-10">
          <Disclaimer />
        </div>
      </main>
    </div>
  );
}
