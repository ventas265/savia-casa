import { AskGlyph } from "@/components/ask-fab";
import { CHIP_TONES, PageTitle } from "@/components/color-blobs";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/disclaimer";
import { type ChatTurn } from "@/lib/savia-server";
import { askGuide } from "@/lib/savia-api";
import { SAVIA_BETA } from "@/lib/beta";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/preguntar")({ component: Preguntar });

function Preguntar() {
  const { t, lang } = useI18n();
  const [q, setQ] = useState("");
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, busy]);

  async function ask(text = q) {
    const question = text.trim();
    if (question.length < 4 || busy) return;
    const history = turns.slice(-8);
    setQ("");
    setTurns((prev) => [...prev, { role: "user", content: question }]);
    setBusy(true);
    try {
      const res = await askGuide({ question, locale: lang, history });
      if (!res.ok) {
        toast.error(res.error === "pay" ? t.payWall : t.aiMissing);
        return;
      }
      setTurns((prev) => [...prev, { role: "assistant", content: res.text }]);
    } catch {
      toast.error(t.aiMissing);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell current="mas">
      <div className="flex items-center gap-3">
        <span className="flex size-14 items-center justify-center rounded-full bg-[#ffd56a] text-ink shadow-card">
          <AskGlyph className="size-7" />
        </span>
        <PageTitle kicker={t.askSub} title={t.askTitle} />
      </div>
      <div className="mt-3">
        <Disclaimer compact />
      </div>

      {turns.length === 0 ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {t.askChips.map((chip, i) => (
            <button
              key={chip}
              type="button"
              className={`rounded-full px-4 py-2.5 text-left text-sm font-semibold shadow-card ${CHIP_TONES[i % CHIP_TONES.length]}`}
              onClick={() => void ask(chip)}
            >
              {chip}
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {turns.map((m, i) => (
            <div
              key={`${m.role}-${i}`}
              className={cn(
                "max-w-[92%] whitespace-pre-wrap rounded-3xl px-4 py-3 text-sm leading-relaxed",
                m.role === "user" ? "ml-auto bg-primary text-primary-fg" : "bg-[#5ee4d6] text-ink",
              )}
            >
              {m.content}
            </div>
          ))}
          {busy ? <p className="text-sm text-muted">{t.asking}</p> : null}
          <div ref={end} />
        </div>
      )}

      {SAVIA_BETA ? (
        <p className="mt-2 text-xs text-muted">{t.serenaOn}</p>
      ) : (
        <p className="mt-2 text-xs text-muted">
          {t.asksLeft}: 3 · <Link to="/pagar" className="underline">{t.navPricing}</Link>
        </p>
      )}
      <form
        className="mt-6 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void ask();
        }}
      >
        <input
          className="min-h-12 flex-1 rounded-full border-0 bg-surface px-4 text-sm outline-none ring-primary focus:ring-2"
          placeholder={t.askHint}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button type="submit" className="rounded-full px-5" disabled={busy || q.trim().length < 4}>
          {busy ? t.asking : t.askCta}
        </Button>
      </form>
    </AppShell>
  );
}
