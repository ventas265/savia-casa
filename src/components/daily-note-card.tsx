import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Annoyed, Frown, MessageCircleHeart, Smile } from "lucide-react";
import { SaviaOrb, OrbCaption } from "@/components/savia-orb";
import { useI18n } from "@/lib/i18n";
import { haptic } from "@/lib/haptic";
import { cn } from "@/lib/utils";
import { SAVIA_BETA } from "@/lib/beta";
import { localToday } from "@/lib/savia-local";
import { writeLog } from "@/lib/savia-api";
import { saviaNoteOpen } from "@/lib/savia-server";
import {
  acceptAiNote,
  buildDailyNote,
  MOOD_VALUE,
  moodReply,
  noteFacts,
  type MoodReply,
  type NoteCtx,
} from "@/lib/daily-note";
import type { SaviaTone } from "@/lib/savia-tone";
import type { DailyLog } from "@/lib/types";

const NOTE_KEY = (day: string, lang: string) => `savia.note.v1.${day}.${lang}`;

type Cached = { src: "ai"; text: string } | { src: "tried" };

function readCache(day: string, lang: string): Cached | null {
  try {
    const raw = localStorage.getItem(NOTE_KEY(day, lang));
    return raw ? (JSON.parse(raw) as Cached) : null;
  } catch {
    return null;
  }
}

/**
 * Template note is always ready; one AI attempt per day upgrades it when xAI
 * answers. Any failure is silent (the template stays).
 */
export function useDailyNote(ctx: NoteCtx, day: string, lang: "es" | "en") {
  const template = useMemo(() => buildDailyNote(ctx, lang, day), [ctx, lang, day]);
  const [ai, setAi] = useState<string | null>(null);
  useEffect(() => {
    const cached = readCache(day, lang);
    if (cached?.src === "ai") {
      setAi(cached.text);
      return;
    }
    if (cached?.src === "tried") return;
    let alive = true;
    try {
      localStorage.setItem(NOTE_KEY(day, lang), JSON.stringify({ src: "tried" } satisfies Cached));
    } catch {
      /* private mode */
    }
    saviaNoteOpen({ data: { locale: lang, facts: noteFacts(ctx), draft: template.text } })
      .then((res) => {
        const text = res.ok ? acceptAiNote(res.text) : null;
        if (!text) return;
        try {
          localStorage.setItem(NOTE_KEY(day, lang), JSON.stringify({ src: "ai", text } satisfies Cached));
        } catch {
          /* ignore */
        }
        if (alive) setAi(text);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
    // One attempt per day/lang; ctx changes during the day keep the template live.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, lang]);
  return { text: ai ?? template.text, fromAi: Boolean(ai), template };
}

function moodOf(v: number | null | undefined): MoodReply | null {
  if (v == null || v <= 0) return null;
  if (v >= 4) return "good";
  if (v === 3) return "meh";
  return "bad";
}

export function DailyNoteCard({
  ctx,
  day,
  tone,
  log,
  paid,
  onSaved,
}: {
  ctx: NoteCtx;
  day: string;
  tone: SaviaTone;
  log: DailyLog | null;
  paid: boolean;
  onSaved?: () => void;
}) {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const note = useDailyNote(ctx, day, lang);
  const [picked, setPicked] = useState<MoodReply | null>(moodOf(log?.mood));
  const [reply, setReply] = useState<string | null>(null);
  useEffect(() => {
    setPicked(moodOf(log?.mood));
  }, [log?.mood]);

  async function saveMood(m: MoodReply) {
    haptic(12);
    setPicked(m);
    setReply(moodReply(m, note.template.situation, lang, day));
    // Freshest copy of today's log so we never clobber other fields.
    const cur = (SAVIA_BETA ? localToday().log : null) ?? log;
    await writeLog({
      day,
      flow: cur?.flow ?? "none",
      mood: MOOD_VALUE[m],
      energy: cur?.energy ?? null,
      sleepHours: cur?.sleepHours ?? null,
      notes: cur?.notes ?? "",
      symptoms: cur?.symptoms ?? [],
      periodStarted: cur?.periodStarted ?? false,
      mucus: cur?.mucus ?? "none",
      sex: cur ? cur.sex : false,
      sexKind: cur?.sexKind ?? "none",
    }).catch(() => null);
    onSaved?.();
  }

  const moods: { id: MoodReply; label: string; Icon: typeof Smile }[] = [
    { id: "good", label: t.moodGood, Icon: Smile },
    { id: "meh", label: t.moodMeh, Icon: Annoyed },
    { id: "bad", label: t.moodBad, Icon: Frown },
  ];

  return (
    <section
      data-testid="daily-note"
      data-source={note.fromAi ? "ai" : "template"}
      className="glass relative mt-2 overflow-hidden rounded-[22px] px-4 pb-4 pt-3.5"
      aria-label={t.noteKicker}
    >
      <div className="flex items-center gap-3">
        <SaviaOrb tone={tone} className="size-10" />
        <div className="min-w-0">
          <p className="kicker !text-label">{t.noteKicker}</p>
          <OrbCaption tone={tone} className="mt-0.5 block" />
        </div>
      </div>
      <p className="mt-3 font-display text-[18px] font-semibold leading-snug tracking-[-0.02em] text-fg">
        {note.template.checkIn && !note.fromAi ? note.template.checkIn : note.text.split(/(?<=[.?!])\s/)[0]}
      </p>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-soft">
        {note.fromAi
          ? note.text.split(/(?<=[.?!])\s/).slice(1).join(" ")
          : note.template.lines.slice(1).join(" ")}
      </p>
      <div className="mt-3.5 grid grid-cols-4 gap-1.5" role="group" aria-label={t.moodAsk}>
        {moods.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            data-mood={id}
            aria-pressed={picked === id}
            onClick={() => void saveMood(id)}
            className={cn(
              "press flex h-[52px] flex-col items-center justify-center gap-0.5 rounded-[16px] text-[11.5px] font-medium",
              picked === id ? "bg-grad text-white shadow-[0_6px_18px_-6px_rgb(242_66_126/0.6)]" : "bg-white/[0.06] text-fg ring-1 ring-white/10",
            )}
          >
            <Icon className="size-[18px]" strokeWidth={1.6} />
            {label}
          </button>
        ))}
        <button
          type="button"
          data-mood="talk"
          onClick={() => {
            haptic(12);
            const ctxLine = note.template.lines.slice(0, 2).join(" ");
            void navigate({
              to: "/app/preguntar",
              search: { q: t.talkPrefill.replace("{ctx}", ctxLine), ctx: "talk" },
            });
          }}
          className="press flex h-[52px] flex-col items-center justify-center gap-0.5 rounded-[16px] bg-white/[0.06] text-[11.5px] font-medium leading-tight text-fg ring-1 ring-white/10"
        >
          <MessageCircleHeart className="size-[18px]" strokeWidth={1.6} />
          {t.moodTalk}
        </button>
      </div>
      {reply ? (
        <p data-testid="mood-reply" role="status" className="mt-3 flex items-start gap-2 text-[13px] leading-snug text-fg">
          <SaviaOrb tone={tone} className="mt-0.5 size-4" />
          {reply}
        </p>
      ) : null}
      {!paid ? (
        <Link to="/pagar" className="mt-3 block text-[11.5px] font-medium text-rose-dust">
          {t.noteSerenaHook}
        </Link>
      ) : null}
    </section>
  );
}
