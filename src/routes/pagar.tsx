import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/site-header";
import { claimSerena, getAskStatus, getPay, type PaySettings } from "@/lib/savia-server";
import { Disclaimer } from "@/components/disclaimer";
import { whopFor } from "@/lib/pay-links";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/pagar")({ component: Pagar });

type Method = "zinli" | "pm" | "usdt" | "card" | "paypal" | "bank";

function Pagar() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState<"serena" | "year">("serena");
  const [method, setMethod] = useState<Method>("card");
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("paid") !== "1") return;
    if (!user) return;
    void claimSerena({ data: { email: user.primaryEmail || email, plan, note: "whop" } })
      .then((res) => {
        if (res.ok) {
          setActive(true);
          toast.success(t.zinliPaidOk);
        }
      })
      .catch(() => {});
  }, [user, email, t.zinliPaidOk]);

  const cardLink = whopFor(plan);
  const paypalLink = pay?.paypalUrl || whopFor(plan);
  const ready =
    method === "zinli"
      ? Boolean(pay?.zinli)
      : method === "pm"
        ? Boolean(pay?.pmPhone)
        : method === "usdt"
          ? Boolean(pay?.usdt)
          : method === "bank"
            ? Boolean(pay?.bankAccount)
          : true;

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
      const dest =
        method === "zinli"
          ? pay?.zinli
          : method === "pm"
            ? pay?.pmPhone
            : method === "usdt"
              ? pay?.usdt
              : method === "paypal"
                ? paypalLink
                : method === "bank"
                  ? `${pay?.bankName || "Banplus"} ${pay?.bankAccount || ""}`
                : cardLink;
      const note = `${method} ${dest || ""}`;
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
        <h1 className="text-2xl font-extrabold">{t.payTitle}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">{t.payBody}</p>
        {active ? <p className="mt-3 text-sm font-medium">{t.serenaActive}</p> : null}

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

        <div className="mt-6 rounded-[1.6rem] bg-ink p-6 text-primary-fg shadow-card">
          <p className="text-sm opacity-70">{plan === "year" ? t.yearName : t.proName}</p>
          <p className="mt-1 text-5xl font-extrabold tracking-tight">{amount}</p>
          <p className="mt-2 text-sm opacity-80">{t.cardOk}</p>
          <Button className="mt-5 w-full bg-primary text-primary-fg" asChild>
            <a href={cardLink} target="_blank" rel="noreferrer">
              {t.cardOpen}
            </a>
          </Button>
          <p className="mt-3 text-xs opacity-70">{t.cardBody}</p>
        </div>

        <details className="mt-6 rounded-[1.6rem] bg-surface p-4 shadow-card">
          <summary className="min-h-11 cursor-pointer list-none text-sm font-semibold">{t.otherPay}</summary>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {(
            [
              ["card", t.methodCard],
              ["paypal", t.methodPaypal],
              ["bank", t.methodBank],
              ["zinli", t.methodZinli],
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
              <p className="break-all text-xs text-muted">{cardLink}</p>
            </div>
          ) : null}
          {method === "paypal" ? (
            <div className="mt-3 space-y-2">
              <p className="text-sm leading-relaxed">{t.paypalBody}</p>
              <p className="break-all text-sm font-medium">{paypalLink}</p>
            </div>
          ) : null}
          {method === "bank" ? (
            pay?.bankAccount ? (
              <div className="mt-3 space-y-1 text-sm">
                <p>{t.bankName}: {pay.bankName || "Banplus"}</p>
                <p>{t.bankHolder}: {pay.bankHolder}</p>
                <p className="font-semibold">{t.bankAccount}: {pay.bankAccount}</p>
                <p className="text-xs text-muted">{t.bankHint}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">{t.zinliNeed}</p>
            )
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={!ready}
              onClick={() =>
                void copy(
                  method === "zinli"
                    ? pay?.zinli || ""
                    : method === "pm"
                      ? [pay?.pmBank, pay?.pmPhone, pay?.pmId].filter(Boolean).join(" · ")
                      : method === "card"
                        ? cardLink
                        : method === "paypal"
                          ? paypalLink
                          : method === "bank"
                            ? pay?.bankAccount || ""
                          : pay?.usdt || "",
                )
              }
            >
              {t.zinliCopy}
            </Button>
            {method === "zinli" ? (
              <Button type="button" asChild>
                <a href="https://www.zinli.com/" target="_blank" rel="noreferrer">
                  {t.zinliOpen}
                </a>
              </Button>
            ) : null}
            {method === "card" ? (
              <Button type="button" asChild>
                <a href={cardLink} target="_blank" rel="noreferrer">
                  {t.cardOpen}
                </a>
              </Button>
            ) : null}
            {method === "paypal" ? (
              <Button type="button" asChild>
                <a href={paypalLink} target="_blank" rel="noreferrer">
                  {t.paypalOpen}
                </a>
              </Button>
            ) : null}
          </div>
        </div>
        </details>

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
