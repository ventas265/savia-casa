import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import { Disclaimer } from "@/components/disclaimer";
import { getPay, savePay, type PaySettings } from "@/lib/savia-server";

export const Route = createFileRoute("/app/cuaderno")({ component: Cuaderno });

const empty: PaySettings = { zinli: "", pmPhone: "", pmBank: "", pmId: "", usdt: "" };

function Cuaderno() {
  const { t } = useI18n();
  const [pay, setPay] = useState<PaySettings>(empty);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getPay()
      .then(setPay)
      .catch(() => setPay(empty));
  }, []);

  async function save() {
    setBusy(true);
    try {
      const res = await savePay({ data: pay });
      if (res.ok) {
        const { zinli, pmPhone, pmBank, pmId, usdt } = res;
        setPay({ zinli, pmPhone, pmBank, pmId, usdt });
        toast.success(t.saved);
      } else toast.error(t.errorGeneric);
    } catch {
      toast.error(t.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell current="mas">
      <h1 className="text-2xl font-semibold">{t.settings}</h1>
      <p className="mt-2 text-muted">{t.payNow}</p>
      <Button className="mt-6" variant="secondary" asChild>
        <Link to="/app/onboarding">{t.onboardingTitle}</Link>
      </Button>

      <div className="mt-8 space-y-4 rounded-3xl bg-surface p-5">
        <div>
          <Label htmlFor="zinli">{t.zinliUser}</Label>
          <Input
            id="zinli"
            className="mt-2"
            value={pay.zinli}
            onChange={(e) => setPay({ ...pay, zinli: e.target.value })}
            placeholder={t.zinliPlaceholder}
          />
        </div>
        <div>
          <Label htmlFor="pmPhone">{t.pmPhone}</Label>
          <Input
            id="pmPhone"
            className="mt-2"
            value={pay.pmPhone}
            onChange={(e) => setPay({ ...pay, pmPhone: e.target.value })}
            placeholder="0412…"
          />
        </div>
        <div>
          <Label htmlFor="pmBank">{t.pmBank}</Label>
          <Input
            id="pmBank"
            className="mt-2"
            value={pay.pmBank}
            onChange={(e) => setPay({ ...pay, pmBank: e.target.value })}
            placeholder="Banesco, Venezuela, Provincial…"
          />
        </div>
        <div>
          <Label htmlFor="pmId">{t.pmId}</Label>
          <Input
            id="pmId"
            className="mt-2"
            value={pay.pmId}
            onChange={(e) => setPay({ ...pay, pmId: e.target.value })}
            placeholder="V-…"
          />
        </div>
        <div>
          <Label htmlFor="usdt">{t.usdtAddr}</Label>
          <Input
            id="usdt"
            className="mt-2"
            value={pay.usdt}
            onChange={(e) => setPay({ ...pay, usdt: e.target.value })}
            placeholder="T…"
          />
        </div>
        <Button type="button" disabled={busy} onClick={() => void save()}>
          {t.save}
        </Button>
        <Button variant="secondary" asChild>
          <Link to="/pagar">{t.payCta}</Link>
        </Button>
      </div>
      <div className="mt-10">
        <Disclaimer />
      </div>
    </AppShell>
  );
}
