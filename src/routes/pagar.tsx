import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import { emptyPay, getAskStatus, getPay, markZinliPaid, type PaySettings } from "@/lib/savia-server";
import { Disclaimer } from "@/components/disclaimer";
import { whopFor } from "@/lib/pay-links";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/pagar")({
  validateSearch: (search: Record<string, unknown>): { plan?: "serena" | "year" } =>
    search.plan === "year" || search.plan === "serena" ? { plan: search.plan } : {},
  component: Pagar,
});

type Method = "zinli" | "pm" | "usdt" | "card" | "paypal" | "bank" | "binance";

function Pagar() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const [email, setEmail] = useState("");
  const { plan: planFromSheet } = Route.useSearch();
  const [plan, setPlan] = useState<"serena" | "year">(planFromSheet ?? "serena");
  const [method, setMethod] = useState<Method>("card");
  const [pay, setPay] = useState<PaySettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const amount = plan === "year" ? "$39" : "$4.99";

  useEffect(() => {
    if (isPending) return;
    if (!user) {
      setPay({ ...emptyPay });
      return;
    }
    getPay()
      .then(setPay)
      .catch(() => setPay({ ...emptyPay }));
  }, [user, isPending]);

  useEffect(() => {
    if (user?.primaryEmail && !email) setEmail(user.primaryEmail);
  }, [user, email]);

  useEffect(() => {
    if (!user) return;
    getAskStatus()
      .then((s) => setActive(s.paid))
      .catch(() => setActive(false));
  }, [user]);

  // Back from Whop (?paid=1): the plan is granted only by the verified Whop
  // webhook, so just re-read the status (no client-side claim).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("paid") !== "1") return;
    if (!user) return;
    const timer = window.setTimeout(() => {
      getAskStatus()
        .then((s) => {
          if (s.paid) {
            setActive(true);
            toast.success(t.zinliPaidOk);
          }
        })
        .catch(() => {});
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [user, t.zinliPaidOk]);

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
            : method === "paypal"
              ? Boolean(pay?.paypalEmail)
              : method === "binance"
                ? Boolean(pay?.binance)
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
                ? pay?.paypalEmail || paypalLink
                : method === "binance"
                  ? pay?.binance
                : method === "bank"
                  ? `${pay?.bankName || "Banplus"} ${pay?.bankAccount || ""}`
                : cardLink;
      const note = `${method} ${dest || ""}`;
      // Records a pending payment for review; never activates the plan by itself.
      const res = await markZinliPaid({ data: { email, plan, note: note.slice(0, 300) } });
      if (res.ok) {
        toast.success(t.payPending);
        void navigate({ to: "/app/hoy" });
      } else toast.error(t.waitlistErr);
    } catch {
      toast.error(t.payNeedLogin);
      void navigate({ to: "/login" });
    } finally {
      setBusy(false);
    }
  }

  const manual = method !== "card";
  const methods = [
    ["card", t.methodCard],
    ["paypal", t.methodPaypal],
    ["binance", t.methodBinance],
    ["bank", t.methodBank],
    ["zinli", t.methodZinli],
    ["pm", t.methodPm],
    ["usdt", t.methodUsdt],
  ] as const;

  function back() {
    if (step === 2) {
      setStep(1);
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) window.history.back();
    else void navigate({ to: "/app/tu" });
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 bg-bg/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-lg items-center gap-3 px-4">
          <button
            type="button"
            onClick={back}
            data-testid="pay-back"
            aria-label={step === 2 ? t.payBackPlans : t.back}
            className="press glass grid size-11 shrink-0 place-items-center rounded-full"
          >
            <ArrowLeft className="size-5" strokeWidth={1.6} />
          </button>
          <p className="min-w-0 flex-1 truncate font-display text-lg font-semibold tracking-[-0.02em]">{t.payTitle}</p>
          <p className="kicker shrink-0 tabular-nums">{t.payStep.replace("{n}", String(step))}</p>
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 pb-10 pt-4">
        {active ? (
          <div data-testid="pay-active" className="card-hot rounded-[22px] p-5">
            <p className="font-display text-xl font-semibold">{t.tuPlanActive}</p>
            <p className="mt-1 text-sm opacity-80">{t.tuPlanActiveSub}</p>
            <Link to="/app/hoy" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold underline">
              {t.enterHoy}
            </Link>
          </div>
        ) : step === 1 ? (
          <section data-testid="pay-step-1">
            <h1 className="font-display text-[1.7rem] font-semibold leading-tight tracking-[-0.03em]">{t.payChoosePlan}</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t.payBody}</p>
            <div className="mt-5 grid grid-cols-2 gap-3" role="radiogroup" aria-label={t.payChoosePlan}>
              {(
                [
                  ["serena", t.proName, t.proPrice, t.proNote],
                  ["year", t.yearName, t.yearPrice, t.yearNote],
                ] as const
              ).map(([id, name, price, note]) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={plan === id}
                  data-plan={id}
                  onClick={() => setPlan(id)}
                  className={`press rounded-[22px] p-4 text-left ${plan === id ? "card-hot ring-2 ring-accent" : "glass"}`}
                >
                  <p className="text-sm opacity-80">{name}</p>
                  <p className="mt-1 font-display text-3xl font-semibold">{price}</p>
                  <p className="mt-1 text-[12.5px] opacity-80">{note}</p>
                </button>
              ))}
            </div>
            <Button className="mt-6 h-14 w-full rounded-full bg-grad text-base text-primary-fg" data-testid="pay-next" onClick={() => setStep(2)}>
              {t.payContinue.replace("{amount}", amount)}
            </Button>
            <p className="mt-4 text-center text-sm">
              <Link to="/app/cuaderno" className="inline-flex min-h-11 items-center text-muted underline">
                {t.zinliSave}
              </Link>
            </p>
          </section>
        ) : (
          <section data-testid="pay-step-2">
            <h1 className="font-display text-[1.7rem] font-semibold leading-tight tracking-[-0.03em]">{t.payChooseMethod}</h1>
            <p className="mt-1 text-sm text-muted">
              {plan === "year" ? t.yearName : t.proName} · <span className="font-semibold text-fg">{amount}</span>
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2" role="radiogroup" aria-label={t.payChooseMethod}>
              {methods.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={method === key}
                  data-method={key}
                  onClick={() => setMethod(key)}
                  className={`press min-h-12 rounded-2xl px-2 text-[13px] font-semibold ${method === key ? "bg-grad text-primary-fg" : "glass text-fg"} ${key === "card" ? "col-span-2" : ""}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="glass mt-4 rounded-[22px] p-5" data-testid="pay-details">
              {method === "card" ? (
                <div>
                  <p className="text-sm leading-relaxed">{t.cardOk}</p>
                  <Button className="mt-4 h-14 w-full rounded-full bg-grad text-base text-primary-fg" asChild>
                    <a href={cardLink} target="_blank" rel="noreferrer" data-testid="pay-card">
                      {t.cardOpen}
                    </a>
                  </Button>
                  <p className="mt-3 text-xs leading-relaxed text-muted">{t.payCardAuto}</p>
                </div>
              ) : (
                <>
                  <p className="text-sm">
                    {t.zinliAmount}: <span className="font-semibold">{amount}</span>
                  </p>
                  <p className="text-sm text-muted">{t.zinliConcept}</p>
                  {method === "zinli" ? (
                    pay?.zinli ? <p className="mt-3 text-3xl font-bold">@{pay.zinli}</p> : <p className="mt-3 text-sm text-muted">{t.zinliNeed}</p>
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
                    pay?.usdt ? <p className="mt-3 break-all text-sm">{pay.usdt}</p> : <p className="mt-3 text-sm text-muted">{t.zinliNeed}</p>
                  ) : null}
                  {method === "paypal" ? (
                    pay?.paypalEmail ? (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm leading-relaxed">{t.paypalBody}</p>
                        <p className="break-all text-2xl font-bold">{pay.paypalEmail}</p>
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-muted">{t.zinliNeed}</p>
                    )
                  ) : null}
                  {method === "binance" ? (
                    pay?.binance ? (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm leading-relaxed">{t.binanceBody}</p>
                        <p className="break-all text-2xl font-bold">{pay.binance}</p>
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-muted">{t.zinliNeed}</p>
                    )
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
                      className="min-h-11"
                      disabled={!ready}
                      onClick={() =>
                        void copy(
                          method === "zinli"
                            ? pay?.zinli || ""
                            : method === "pm"
                              ? [pay?.pmBank, pay?.pmPhone, pay?.pmId].filter(Boolean).join(" · ")
                              : method === "paypal"
                                ? pay?.paypalEmail || ""
                                : method === "binance"
                                  ? pay?.binance || ""
                                  : method === "bank"
                                    ? pay?.bankAccount || ""
                                    : pay?.usdt || "",
                        )
                      }
                    >
                      {t.zinliCopy}
                    </Button>
                    {method === "zinli" ? (
                      <Button type="button" className="min-h-11" asChild>
                        <a href="https://www.zinli.com/" target="_blank" rel="noreferrer">
                          {t.zinliOpen}
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </>
              )}
            </div>

            {/* «Ya pagué» only for manual methods: records a pending payment for review. */}
            {manual ? (
              <form className="mt-5 space-y-3" onSubmit={(e) => void paid(e)} data-testid="pay-manual-form">
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
                  className="min-h-12"
                />
                <Button type="submit" className="h-14 w-full rounded-full text-base" disabled={busy || !ready} data-testid="pay-done">
                  {t.zinliPaid}
                </Button>
                <p className="text-center text-xs text-muted">{t.payPendingHint}</p>
              </form>
            ) : null}
          </section>
        )}
        <div className="mt-10">
          <Disclaimer />
        </div>
      </main>
    </div>
  );
}
