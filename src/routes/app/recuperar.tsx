import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageTitle } from "@/components/color-blobs";
import { Button } from "@/components/ui/button";
import { setDeviceId, setDeviceToken } from "@/lib/device";
import { recoverDevice } from "@/lib/testers";
import { loadToday } from "@/lib/savia-api";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/app/recuperar")({ component: Recuperar });

function Recuperar() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [bad, setBad] = useState(false);

  async function go() {
    setBad(false);
    setBusy(true);
    try {
      const res = await recoverDevice({ data: { code } });
      if (!res.ok) {
        setBad(true);
        return;
      }
      setDeviceId(res.deviceId);
      setDeviceToken(res.token);
      await loadToday();
      void navigate({ to: "/app/hoy" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageTitle title={t.recoverTitle} />
      <p className="mt-2 text-sm text-muted">{t.recoverBody}</p>
      <form
        className="mt-6 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          void go();
        }}
      >
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="h-14 w-full rounded-full bg-surface px-5 font-display text-lg font-semibold tracking-[0.06em] outline-none"
          placeholder="XXXX-XXXX-XXXX-XXXX"
          maxLength={40}
          autoCapitalize="characters"
        />
        {bad ? <p className="text-sm text-primary">{t.recoverBad}</p> : null}
        <Button type="submit" className="h-12 w-full rounded-full" disabled={busy || code.trim().length < 6}>
          {t.recoverCta}
        </Button>
      </form>
    </div>
  );
}
