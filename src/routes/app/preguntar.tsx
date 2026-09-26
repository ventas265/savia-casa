import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type ChatTurn } from "@/lib/savia-server";
import { askGuide } from "@/lib/savia-api";
import { SAVIA_BETA } from "@/lib/beta";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { OrbCaption, SaviaOrb, useSaviaTone } from "@/components/savia-orb";
import type { SaviaTone } from "@/lib/savia-tone";
import { localToday } from "@/lib/savia-local";
import { todayISO } from "@/lib/cycle";
import { talkOpener } from "@/lib/companion-messages";

type ChatCtx = "talk" | "day" | "ec";

export const Route = createFileRoute("/app/preguntar")({
  validateSearch: (search: Record<string, unknown>): { q?: string; ctx?: ChatCtx } => {
    const out: { q?: string; ctx?: ChatCtx } = {};
    if (typeof search.q === "string" && search.q.trim()) out.q = search.q.slice(0, 600);
    if (search.ctx === "talk" || search.ctx === "day" || search.ctx === "ec") out.ctx = search.ctx;
    return out;
  },
  component: Preguntar,
});

/** Savia IA presence: the breathing pearl, tinted by her phase. */
function Face({ className, tone }: { className?: string; tone: SaviaTone }) {
  return <SaviaOrb tone={tone} className={className} />;
}

function Preguntar() {
  const { t, lang } = useI18n();
  const { q: prefill, ctx } = Route.useSearch();
  const tone = useSaviaTone();
  const [q, setQ] = useState(prefill ?? "");
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const canSend = q.trim().length > 0 && !busy;
  const [talkLine, setTalkLine] = useState<string | null>(null);

  useEffect(() => {
    if (ctx !== "talk") return;
    const name = SAVIA_BETA ? localToday().profile.displayName : "";
    setTalkLine(talkOpener(lang, todayISO(), name));
  }, [ctx, lang]);

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
      const res = await askGuide({ question, locale: lang, history }).catch(() => ({ ok: false as const, error: "ai" as const }));
      if (!res.ok) {
        if (res.error === "pay") {
          toast.error(t.payWall);
          return;
        }
        // AI down: answer in-character with a deterministic line, never an error toast.
        const fallback = ctx === "ec" ? t.chatFallbackEc : ctx === "talk" ? t.chatFallbackTalk : t.chatFallback;
        setTurns((prev) => [...prev, { role: "assistant", content: fallback }]);
        return;
      }
      setTurns((prev) => [...prev, { role: "assistant", content: res.text }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-[calc(100dvh-5.5rem)] flex-col">
      <div className="flex shrink-0 items-center gap-3">
        <Link
          to="/app/hoy"
          className="press glass flex size-11 shrink-0 items-center justify-center rounded-full text-fg"
          aria-label={t.today}
        >
          <ArrowLeft className="size-5" strokeWidth={1.5} />
        </Link>
        <Face tone={tone} className="size-11" />
        <div className="min-w-0">
          <p className="font-display text-xl font-semibold leading-none tracking-[-0.02em]">{t.askTitle}</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted"><span className="size-1.5 rounded-full bg-[#6fe0d2]" aria-hidden />{t.askHere}</p>
          <OrbCaption tone={tone} className="mt-0.5 block" />
        </div>
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
        {turns.length === 0 ? (
          <div className="glass relative overflow-hidden rounded-[22px] p-5">
            <Face tone={tone} className="size-16" />
            <p className="mt-5 font-display text-[1.6rem] font-semibold leading-[1.1] tracking-[-0.035em] text-fg">
              {talkLine ?? t.askEmpty}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {turns.map((m, i) => (
              <div
                key={`${m.role}-${i}`}
                className={cn("flex items-end gap-2", m.role === "user" ? "justify-end" : "justify-start")}
              >
                {m.role === "assistant" ? <Face tone={tone} className="size-8 shrink-0" /> : null}
                <div
                  className={cn(
                    "max-w-[78%] whitespace-pre-wrap px-4 py-3 text-sm leading-relaxed",
                    m.role === "user"
                      ? "rounded-[1.4rem] rounded-br-md bg-grad text-primary-fg"
                      : "glass rounded-[1.4rem] rounded-bl-md text-fg",
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {busy ? (
              <div className="flex items-end gap-2">
                <Face tone={tone} className="size-8" />
                <div className="glass flex gap-1 rounded-[1.4rem] rounded-bl-md px-4 py-3">
                  <span className="size-1.5 animate-bounce rounded-full bg-grad [animation-delay:0ms]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-grad [animation-delay:120ms]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-grad [animation-delay:240ms]" />
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
        className="mt-3 flex shrink-0 items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void ask();
        }}
      >
        <textarea
          rows={q.length > 60 ? 3 : 1}
          inputMode="text"
          autoComplete="off"
          autoCorrect="on"
          enterKeyHint="send"
          data-testid="chat-input"
          className={cn(
            "glass min-h-14 min-w-0 flex-1 resize-none px-5 py-4 text-base leading-snug text-fg outline-none focus:border-[rgb(242_66_126/0.5)]",
            q.length > 60 ? "rounded-[22px] text-[15px]" : "rounded-full",
          )}
          placeholder={t.askHint}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void ask();
            }
          }}
        />
        <Button
          type="submit"
          className="size-14 shrink-0 rounded-full p-0 disabled:opacity-40"
          disabled={!canSend}
          aria-label={t.askCta}
          title={t.askCta}
        >
          {busy ? (
            <span className="size-4 animate-spin rounded-full border-2 border-primary-fg/40 border-t-primary-fg" />
          ) : (
            <ArrowUp className="size-5" strokeWidth={2} />
          )}
        </Button>
      </form>
    </div>
  );
}