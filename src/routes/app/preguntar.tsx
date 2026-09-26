import { createFileRoute } from "@tanstack/react-router";
import type { Phase } from "@/lib/types";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowUp, Lock, Sparkles } from "lucide-react";
import { useV4 } from "@/lib/i18n-v4";
import { useSerenaSheet } from "@/lib/serena-sheet";
import { computeInsights, insightText } from "@/lib/insights";
import { localAllLogs } from "@/lib/savia-local";
import { predictPeriod } from "@/lib/cycle";
import { type ChatTurn } from "@/lib/savia-server";
import { askGuide } from "@/lib/savia-api";
import { SAVIA_BETA } from "@/lib/beta";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
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

/** Empty-state suggestions by phase (avoid-pregnancy framing, never trying-to-conceive). */
const SUGGEST: Record<Phase, { es: string[]; en: string[] }> = {
  menstrual: {
    es: ["¿Qué alivia los cólicos sin pastillas?", "¿Cuánto sangrado es normal?", "¿Puedo hacer ejercicio con la regla?", "¿Por qué me siento tan cansada?"],
    en: ["What eases cramps without pills?", "How much bleeding is normal?", "Can I exercise on my period?", "Why do I feel so tired?"],
  },
  follicular: {
    es: ["¿Cuándo empiezan mis días fértiles?", "¿Qué método anticonceptivo me conviene?", "¿Por qué cambia mi flujo?", "¿Qué comer para tener energía?"],
    en: ["When do my fertile days start?", "Which birth control could suit me?", "Why does my discharge change?", "What to eat for energy?"],
  },
  ovulatory: {
    es: ["¿Qué tan probable es un embarazo hoy?", "Se rompió el condón, ¿qué hago?", "¿Cómo funciona la pastilla del día después?", "¿Es normal un dolor a un lado?"],
    en: ["How likely is pregnancy today?", "The condom broke, what do I do?", "How does the morning-after pill work?", "Is a one-sided twinge normal?"],
  },
  luteal: {
    es: ["¿Cómo calmo el síndrome premenstrual?", "¿Cuándo tiene sentido una prueba de embarazo?", "¿Por qué tengo antojos?", "¿Es normal sentirme más triste estos días?"],
    en: ["How do I ease PMS?", "When does a pregnancy test make sense?", "Why do I have cravings?", "Is it normal to feel sadder these days?"],
  },
  none: {
    es: ["¿Cómo empiezo a registrar mi ciclo?", "¿Qué método anticonceptivo me conviene?", "¿Qué es normal en un ciclo?", "¿Cuándo debería ir al ginecólogo?"],
    en: ["How do I start tracking my cycle?", "Which birth control could suit me?", "What is normal in a cycle?", "When should I see a gynecologist?"],
  },
};

function Preguntar() {
  const { t, lang } = useI18n();
  const { q: prefill, ctx } = Route.useSearch();
  const { v } = useV4();
  const showSerena = useSerenaSheet((st) => st.show);
  const [q, setQ] = useState(prefill ?? "");
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const canSend = q.trim().length > 0 && !busy;
  const [talkLine, setTalkLine] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("none");
  const [dataLine, setDataLine] = useState<string | null>(null);
  useEffect(() => {
    if (!SAVIA_BETA) return;
    try {
      const snap = localToday();
      setPhase(snap.phase);
      // «En tus datos»: one real, on-device insight (never invented).
      const p = snap.profile;
      const len = predictPeriod(p.lastPeriodStart, snap.periodStarts, p.cycleLength, p.stage).len;
      const res = computeInsights({ starts: snap.periodStarts, logs: localAllLogs(), periodLength: p.periodLength, cycleLength: len, today: todayISO() });
      const first = res.items.find((i) => i.id === "symptomBefore") ?? res.items[0];
      if (first) {
        const txt = insightText(first, lang);
        setDataLine(`${txt.title} ${txt.detail}`.trim());
      }
    } catch {
      /* no local data */
    }
  }, [lang]);

  useEffect(() => {
    if (ctx !== "talk") return;
    const name = SAVIA_BETA ? localToday().profile.displayName : "";
    setTalkLine(talkOpener(lang, todayISO(), name));
  }, [ctx, lang]);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [turns, busy]);

  async function ask(preset?: string) {
    const question = (preset ?? q).trim();
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

  const quick = SUGGEST[phase][lang].slice(0, 3);
  return (
    <div className="-mx-3 -mt-[max(12px,env(safe-area-inset-top))] flex h-[calc(100dvh-5.5rem)] flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b border-line px-5 pb-3 pt-[max(14px,env(safe-area-inset-top))]">
        <img src="/v4/savia-avatar.webp" alt="" width={44} height={44} className="size-11 rounded-full object-cover" />
        <div className="min-w-0 flex-1">
          <p className="text-[17px] font-semibold leading-tight">{t.askTitle}</p>
          <p className="mt-0.5 text-[13px] font-medium text-muted">{v.chatSub}</p>
        </div>
        <span className="v4-lock" aria-label={v.onlyYouAria}>
          <Lock className="size-[14px]" strokeWidth={1.8} aria-hidden />
          {v.private}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3.5 pt-3">
        <div className="flex flex-col gap-1.5">
          <p className="mb-1 self-center text-[12px] font-semibold text-muted">{v.chatToday}</p>
          {turns.length === 0 ? (
            <div data-testid="ask-empty" className="flex flex-col gap-1.5">
              <div className="v4-m sv">{talkLine ?? t.askEmpty}</div>
              {dataLine ? (
                <div className="v4-m sv data" data-testid="ask-data">
                  <p className="v4-eyebrow acc mb-1.5">
                    <Sparkles className="size-3.5" strokeWidth={1.8} aria-hidden />
                    {v.inYourData}
                  </p>
                  {dataLine}
                </div>
              ) : null}
            </div>
          ) : (
            turns.map((m, i) => (
              <div key={`${m.role}-${i}`} className={cn("v4-m", m.role === "user" ? "me" : "sv")}>
                {m.content}
              </div>
            ))
          )}
          {busy ? (
            <div className="flex gap-1 self-start rounded-[22px] rounded-bl-md bg-white px-[15px] py-[13px]" aria-label="…">
              <span className="size-[7px] animate-bounce rounded-full bg-muted [animation-delay:0ms]" />
              <span className="size-[7px] animate-bounce rounded-full bg-muted [animation-delay:120ms]" />
              <span className="size-[7px] animate-bounce rounded-full bg-muted [animation-delay:240ms]" />
            </div>
          ) : null}
          <div ref={end} />
        </div>
      </div>

      {SAVIA_BETA ? null : (
        <p className="shrink-0 px-5 pt-1 text-xs text-muted">
          {t.asksLeft}: 3 ·{" "}
          <button type="button" className="underline" onClick={showSerena}>
            {t.navPricing}
          </button>
        </p>
      )}

      <div className="flex shrink-0 gap-2 overflow-x-auto px-3.5 pb-1 pt-2" data-testid="ask-suggestions">
        {quick.map((sq) => (
          <button key={sq} type="button" onClick={() => void ask(sq)} className="v4-quick press max-w-[16rem] text-left">
            {sq}
          </button>
        ))}
      </div>

      <form
        className="flex shrink-0 items-end gap-2 px-3.5 pt-2"
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
          aria-label={v.askPlaceholder}
          className={cn(
            "min-h-12 min-w-0 flex-1 resize-none border border-line bg-white px-[18px] py-3 text-[15px] leading-snug text-ink outline-none placeholder:text-muted focus:border-accent",
            q.length > 60 ? "rounded-[22px]" : "rounded-full",
          )}
          placeholder={v.askPlaceholder}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void ask();
            }
          }}
        />
        <button
          type="submit"
          className="grid size-12 shrink-0 place-items-center rounded-full bg-accent text-white disabled:opacity-60"
          disabled={!canSend}
          aria-label={t.askCta}
          title={t.askCta}
        >
          {busy ? (
            <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            <ArrowUp className="size-5" strokeWidth={2} />
          )}
        </button>
      </form>
      <p className="shrink-0 pb-2 pt-1.5 text-center text-[11.5px] font-medium text-muted" data-testid="ask-disclaimer">
        {v.disclaimer}
      </p>
    </div>
  );
}
