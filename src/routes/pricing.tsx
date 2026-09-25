import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/site-header";
import { joinWaitlist } from "@/lib/savia-server";
import { Disclaimer } from "@/components/disclaimer";

export const Route = createFileRoute("/pricing")({ component: Pricing });

function Pricing() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState<"serena" | "year" | null>(null);
  const [busy, setBusy] = useState(false);

  async function join(next: "serena" | "year") {
    setPlan(next);
    if (!email.trim()) return;
    setBusy(true);
    try {
      const res = await joinWaitlist({ data: { email, plan: next } });
      if (res.ok) toast.success(t.waitlistOk);
      else toast.error(t.waitlistErr);
    } catch {
      toast.error(t.waitlistErr);
    } finally {
      setBusy(false);
    }
  }

  const cards = [
    {
      name: t.freeName,
      price: t.freePrice,
      note: t.freeNote,
      feats: t.featFree,
      cta: t.chooseFree,
      action: "free" as const,
    },
    {
      name: t.proName,
      price: t.proPrice,
      note: t.proNote,
      feats: t.featPro,
      cta: t.choosePro,
      action: "serena" as const,
    },
    {
      name: t.yearName,
      price: t.yearPrice,
      note: t.yearNote,
      feats: t.featYear,
      cta: t.choosePro,
      action: "year" as const,
    },
  ];

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-lg px-4 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">{t.pricingTitle}</h1>
        <p className="mt-2 text-sm text-muted">{t.pricingSub}</p>
        <div className="mt-6 grid gap-4">
          {cards.map((card) => (
            <div
              key={card.name}
              className={`flex flex-col rounded-3xl p-5 ${
                card.action === "serena" ? "bg-surface ring-2 ring-select-ring" : "bg-surface"
              }`}
            >
              <p className="text-sm font-medium text-muted">{card.name}</p>
              <p className="mt-2 text-3xl font-bold">{card.price}</p>
              <p className="mt-1 text-sm text-muted">{card.note}</p>
              <ul className="mt-6 flex-1 space-y-2 text-sm">
                {card.feats.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="mt-1 size-1.5 shrink-0 rounded-full bg-grad" />
                    {f}
                  </li>
                ))}
              </ul>
              {card.action === "free" ? (
                <Button className="mt-8" asChild>
                  <Link to="/login">{card.cta}</Link>
                </Button>
              ) : (
                <Button
                  className="mt-8"
                  variant={card.action === "serena" ? "default" : "secondary"}
                  asChild
                >
                  <Link to="/pagar">{t.payCta}</Link>
                </Button>
              )}
            </div>
          ))}
        </div>
        <h2 className="mt-10 text-xl font-semibold">{t.payTitle}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{t.payBody}</p>
        <p className="mt-2 max-w-xl text-sm">{t.cardOk}</p>
        <p className="mt-1 max-w-xl text-sm text-muted">{t.noDeposit}</p>
        <p className="mt-4 max-w-xl text-sm">{t.payNow}</p>
        <form
          className="mt-10 max-w-md"
          onSubmit={(e) => {
            e.preventDefault();
            void join(plan || "serena");
          }}
        >
          <label className="text-sm font-medium" htmlFor="wait-email">
            {t.emailWait}
          </label>
          <div className="mt-2 flex gap-2">
            <Input
              id="wait-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
            />
            <Button type="submit" disabled={busy}>
              {t.choosePro}
            </Button>
          </div>
        </form>
        <div className="mt-10">
          <Disclaimer />
        </div>
      </main>
    </div>
  );
}
