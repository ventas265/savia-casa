import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Annoyed, Frown, MessageCircleHeart, Smile } from "lucide-react";
import { SaviaOrb, OrbCaption } from "@/components/savia-orb";
import { useI18n } from "@/lib/i18n";
import { haptic } from "@/lib/haptic";
import { cn } from "@/lib/utils";
import { SAVIA_BETA } from "@/lib/beta";
import { localToday } from "@/lib/savia-local";
import { deviceCreds, writeLog } from "@/lib/savia-api";
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
import { companionName, momentForHour } from "@/lib/companion-messages";
import type { SaviaTone } from "@/lib/savia-tone";
import type { DailyLog } from "@/lib/types";

const NOTE_KEY = (day: string, lang: string, slot: string) => `savia.note.v2.${day}.${lang}.${slot}`;

type Cached = { src: "ai"; text: string } | { src: "tried" };

function readCache(key: string): Cached | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Cached) : null;
  } catch {
    return null;
  }
}

/**
 * Template note is always ready; one AI attempt per day upgrades it when xAI
 * answers. Any failure is silent (the template stays).
 */
/** Local wall-clock hour, refreshed every 5 minutes (the greeting follows the day). */
export function useLocalHour() {
  const [hour, setHour] = useState(() => new Date().getHours());
  useEffect(() => {
    const id = window.setInterval(() => setHour(new Date().getHours()), 5 * 60 * 1000);
    return () => window.clearInterval(id);
  }, []);
  return hour;
}

/**
 * Template note is always ready; one AI attempt per day + moment (morning /
 * afternoon / night) upgrades it when xAI answers, so the greeting stays right.
 * Any failure is silent (the template stays).
 */
export function useDailyNote(ctx: NoteCtx, day: string, lang: "es" | "en", name?: string | null) {
  const hour = useLocalHour();
  const moment = momentForHour(hour);
  const who = companionName(name);
  const template = useMemo(
    () => buildDailyNote(ctx, lang, day, { name: who, hour }),
    // hour only matters through its moment
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ctx, lang, day, who, moment],
  );
  const key = NOTE_KEY(day, lang, `${moment}.${who.toLowerCase() || "-"}`);
  const [ai, setAi] = useState<string | null>(null);
  useEffect(() => {
    setAi(null);
    const cached = readCache(key);
    if (cached?.src === "ai") {
      setAi(cached.text);
      return;
    }
    if (cached?.src === "tried") return;
    let alive = true;
    // The AI note needs the beta device credential; without it the template stays.
    void deviceCreds()
      .then((c) => {
        if (!c || !alive) return null;
        try {
          localStorage.setItem(key, JSON.stringify({ src: "tried" } satisfies Cached));
        } catch {
          /* private mode */
        }
        return saviaNoteOpen({
      data: {
        ...c,
        locale: lang,
        facts: noteFacts(ctx),
        draft: template.text,
        name: who,
        greeting: template.opener.greeting,
        moment,
      },
    });
      })
      .then((res) => {
        const text = res?.ok ? acceptAiNote(res.text, template.opener.greeting) : null;
        if (!text) return;
        try {
          localStorage.setItem(key, JSON.stringify({ src: "ai", text } satisfies Cached));
        } catch {
          /* ignore */
        }
        if (alive) setAi(text);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
    // One attempt per day/lang/moment/name; ctx changes during the day keep the template live.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return { text: ai ?? template.text, fromAi: Boolean(ai), template, name: who };
}

/** AI note → headline (greeting + questions, up to the last leading «?») and the rest. */
function splitAiNote(text: string) {
  const parts = text.split(/(?<=[.?!])\s+/);
  let n = 1;
  for (let i = 0; i < Math.min(parts.length, 4); i++) {
    if (parts[i]!.trim().endsWith("?")) n = i + 1;
    else if (i > 0) break;
  }
  return { head: parts.slice(0, n).join(" "), rest: parts.slice(n).join(" ") };
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
  name,
}: {
  ctx: NoteCtx;
  day: string;
  tone: SaviaTone;
  log: DailyLog | null;
  paid: boolean;
  onSaved?: () => void;
  /** Registered name (profile.displayName). */
  name?: string | null;
}) {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const note = useDailyNote(ctx, day, lang, name);
  const [picked, setPicked] = useState<MoodReply | null>(moodOf(log?.mood));
  const [reply, setReply] = useState<string | null>(null);
  useEffect(() => {
    setPicked(moodOf(log?.mood));
  }, [log?.mood]);

  async function saveMood(m: MoodReply) {
    haptic(12);
    setPicked(m);
    setReply(moodReply(m, note.template.situation, lang, day, note.name));
    // Merge: only the mood changes; the rest of today's log stays as stored.
    await writeLog({ day, mood: MOOD_VALUE[m] }).catch(() => null);
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
        {note.fromAi ? splitAiNote(note.text).head : note.template.checkIn}
      </p>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-soft">
        {note.fromAi
          ? splitAiNote(note.text).rest
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
