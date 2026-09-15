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
  const box = useRef<HTMLTextAreaElement>(null);
  const canSend = q.trim().length > 0 && !busy;

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, busy]);

  async function ask() {
    const question = q.trim();
    if (question.length < 1 || busy) return;
    const history = turns.slice(-8);
    setQ("");
    if (box.current) box.current.style.height = "56px";
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
      box.current?.focus();
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-4.5rem)] flex-col">
      <div className="flex items-center gap-3">
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

      <div className="relative mt-4 flex-1 pb-28">
        {turns.length === 0 ? (
          <div className="relative overflow-hidden rounded-[1.6rem]">
            <img
              src="/photos/savia-ia-hero.jpg"
              alt=""
              className="h-56 w-full object-cover object-[center_40%]"
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
        <p className="mt-2 text-xs text-muted">
          {t.asksLeft}: 3 ·{" "}
          <Link to="/pagar" className="underline">
            {t.navPricing}
          </Link>
        </p>
      )}

      <form
        className="fixed bottom-0 left-1/2 z-30 flex w-full max-w-lg -translate-x-1/2 gap-2 bg-bg px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:max-w-[28rem]"
        onSubmit={(e) => {
          e.preventDefault();
          void ask();
        }}
      >
        <textarea
          ref={box}
          rows={1}
          enterKeyHint="send"
          className="max-h-32 min-h-14 flex-1 resize-none rounded-[1.4rem] border-0 bg-surface px-5 py-4 text-base outline-none ring-primary focus:ring-2"
          placeholder={t.askHint}
          value={q}
          autoFocus
          onChange={(e) => {
            setQ(e.target.value);
            e.target.style.height = "56px";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void ask();
            }
          }}
        />
        <Button
          type="submit"
          className="h-14 min-w-14 shrink-0 rounded-full px-5"
          disabled={!canSend}
          aria-label={t.askCta}
        >
          {busy ? "…" : t.askCta}
        </Button>
      </form>
    </div>
  );
}