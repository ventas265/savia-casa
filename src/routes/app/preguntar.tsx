import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Disclaimer } from "@/components/disclaimer";
import { askSavia } from "@/lib/savia-server";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/app/preguntar")({ component: Preguntar });

function Preguntar() {
  const { t, lang } = useI18n();
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const [busy, setBusy] = useState(false);

  async function ask() {
    if (q.trim().length < 4) return;
    setBusy(true);
    try {
      const res = await askSavia({ data: { question: q, locale: lang } });
      if (!res.ok) {
        toast.error(t.aiMissing);
        return;
      }
      setA(res.text);
    } catch {
      toast.error(t.aiMissing);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell current="mas">
      <h1 className="text-2xl font-semibold">{t.askTitle}</h1>
      <div className="mt-3">
        <Disclaimer compact />
      </div>
      <Textarea
        className="mt-6 min-h-32"
        placeholder={t.askHint}
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <Button className="mt-4 w-full" type="button" disabled={busy || q.trim().length < 4} onClick={() => void ask()}>
        {busy ? t.asking : t.askCta}
      </Button>
      {a ? (
        <div className="mt-8 whitespace-pre-wrap rounded-3xl bg-surface p-5 text-sm leading-relaxed">
          {a}
        </div>
      ) : null}
    </AppShell>
  );
}
