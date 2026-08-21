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

const empty: PaySettings = {
  zinli: "",
  pmPhone: "04141647902",
  pmBank: "BNC",
  pmId: "V-16.919.161",
  usdt: "",
  cardUrl: "",
  paypalUrl: "",
  paypalEmail: "Claufaria85@gmail.com",
  binance: "claufaria_14@hotmail.com",
  bankName: "Banplus",
  bankAccount: "",
  bankHolder: "",
};

function Cuaderno() {
  const { t } = useI18n();
  const [pay, setPay] = useState<PaySettings>(empty);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getPay()
      .then((p) => setPay({ ...empty, ...p }))
      .catch(() => setPay(empty));
  }, []);

  async function save() {
    setBusy(true);
    try {
      const res = await savePay({ data: pay });
      if (res.ok) {
        setPay({ ...empty, ...res });
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
      <p className="mt-2 text-sm leading-relaxed text-muted">{t.morePayHint}</p>
      <Button className="mt-6" variant="secondary" asChild>
        <Link to="/app/onboarding">{t.profile}</Link>
      </Button>

      <div className="mt-8 space-y-4 rounded-3xl bg-surface p-5">
        <h2 className="text-lg font-bold">{t.payIdPm}</h2>
        <div>
          <Label htmlFor="pmBank">{t.pmBank}</Label>
          <Input id="pmBank" className="mt-2" value={pay.pmBank} onChange={(e) => setPay({ ...pay, pmBank: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="pmPhone">{t.pmPhone}</Label>
          <Input id="pmPhone" className="mt-2" value={pay.pmPhone} onChange={(e) => setPay({ ...pay, pmPhone: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="pmId">{t.pmId}</Label>
          <Input id="pmId" className="mt-2" value={pay.pmId} onChange={(e) => setPay({ ...pay, pmId: e.target.value })} />
        </div>

        <h2 className="pt-2 text-lg font-bold">{t.payIdPaypal}</h2>
        <div>
          <Label htmlFor="paypalEmail">{t.paypalEmail}</Label>
          <Input
            id="paypalEmail"
            className="mt-2"
            type="email"
            value={pay.paypalEmail}
            onChange={(e) => setPay({ ...pay, paypalEmail: e.target.value })}
          />
        </div>

        <h2 className="pt-2 text-lg font-bold">{t.payIdBinance}</h2>
        <div>
          <Label htmlFor="binance">{t.binanceLabel}</Label>
          <Input
            id="binance"
            className="mt-2"
            type="email"
            value={pay.binance}
            onChange={(e) => setPay({ ...pay, binance: e.target.value })}
          />
        </div>

        <h2 className="pt-2 text-lg font-bold">{t.methodBank}</h2>
        <div>
          <Label htmlFor="bankName">{t.bankName}</Label>
          <Input id="bankName" className="mt-2" value={pay.bankName} onChange={(e) => setPay({ ...pay, bankName: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="bankHolder">{t.bankHolder}</Label>
          <Input id="bankHolder" className="mt-2" value={pay.bankHolder} onChange={(e) => setPay({ ...pay, bankHolder: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="bankAccount">{t.bankAccount}</Label>
          <Input id="bankAccount" className="mt-2" value={pay.bankAccount} onChange={(e) => setPay({ ...pay, bankAccount: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="zinli">{t.zinliUser}</Label>
          <Input id="zinli" className="mt-2" value={pay.zinli} onChange={(e) => setPay({ ...pay, zinli: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="usdt">{t.usdtAddr}</Label>
          <Input id="usdt" className="mt-2" value={pay.usdt} onChange={(e) => setPay({ ...pay, usdt: e.target.value })} />
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
