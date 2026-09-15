import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { type ChatTurn } from "@/lib/savia-server";
import { askGuide } from "@/lib/savia-api";
import { SAVIA_BETA } from "@/lib/beta";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/preguntar")({ component: Preguntar });

function Face({ className }: { className?: string }) {
  return (
    <img
      src="/photos/savia-ia.jpg"
      alt=""
      className={cn("rounded-full object-cover object-[center_20%] shadow-card", className)}
    />
  );
}

function Preguntar() {
  const { t, lang } = useI18n();
  const [q, setQ] = useState("");
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const canSend = q.trim().length > 0 && !busy;

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [turns, busy]);

  async function ask() {
    const question = q.trim();
    if (question.length < 1 || busy) return;
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
    <div className="flex h-[calc(100dvh-5.5rem)] flex-col">
      <div className="flex shrink-0 items-center gap-3">
        <Link
          to="/app/hoy"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface text-lg font-semibold text-fg"
          aria-label={t.today}
        >
          ←
        </Link>
        <Face className="size-12" />
        <div className="min-w-0">
          <p className="font-display text-xl font-semibold leading-none">{t.askTitle}</p>
          <p className="mt-1 text-sm text-muted">{t.askHere}</p>
        </div>
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
        {turns.length === 0 ? (
          <div className="relative overflow-hidden rounded-[1.6rem]">
            <img
              src="/photos/savia-ia-hero.jpg"
              alt=""
              className="h-40 w-full object-cover object-[center_40%]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
            <p className="absolute bottom-4 left-4 right-4 font-display text-2xl font-semibold text-primary-fg">
              {t.askEmpty}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {turns.map((m, i) => (
              <div
                key={`${m.role}-${i}`}
                className={cn("flex items-end gap-2", m.role === "user" ? "justify-end" : "justify-start")}
              >
                {m.role === "assistant" ? <Face className="size-8 shrink-0" /> : null}
                <div
                  className={cn(
                    "max-w-[78%] whitespace-pre-wrap px-4 py-3 text-sm leading-relaxed",
                    m.role === "user"
                      ? "rounded-[1.4rem] rounded-br-md bg-primary text-primary-fg"
                      : "rounded-[1.4rem] rounded-bl-md bg-surface text-fg shadow-card",
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {busy ? (
              <div className="flex items-end gap-2">
                <Face className="size-8" />
                <div className="flex gap-1 rounded-[1.4rem] rounded-bl-md bg-surface px-4 py-3 shadow-card">
                  <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:0ms]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:120ms]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:240ms]" />
                </div>
              </div>
            ) : null}
            <div ref={end} />
          </div>
        )}
      </div>

      {SAVIA_BETA ? null : (
        <p className="mt-2 shrink-0 text-xs text-muted">
          {t.asksLeft}: 3 ·{" "}
          <Link to="/pagar" className="underline">
            {t.navPricing}
          </Link>
        </p>
      )}

      <form
        className="mt-3 flex shrink-0 gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void ask();
        }}
      >
        <input
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCorrect="on"
          enterKeyHint="send"
          className="min-h-14 min-w-0 flex-1 rounded-full border-0 bg-surface px-5 text-base text-fg outline-none ring-primary focus:ring-2"
          placeholder={t.askHint}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button type="submit" className="h-14 shrink-0 rounded-full px-5" disabled={!canSend}>
          {busy ? "…" : t.askCta}
        </Button>
      </form>
    </div>
  );
}