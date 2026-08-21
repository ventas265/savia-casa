import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { localFeelingToday, localNoteToday, localSetFeeling, localSetUserNote, type Feeling } from "@/lib/savia-local";
import type { Phase, Stage } from "@/lib/types";
import { haptic } from "@/lib/haptic";
import { songListenUrl, songToday } from "@/lib/songs";
import { cn } from "@/lib/utils";

export function CartaHoy({
  stage,
  phase,
  onAsk,
}: {
  name?: string;
  stage: Stage;
  phase: Phase;
  onAsk: () => void;
}) {
  const { t, lang } = useI18n();
  const note = localNoteToday(stage, phase, lang);
  const song = songToday(stage, phase);
  const [feeling, setFeeling] = useState<Feeling | null>(() => localFeelingToday());
  const [mine, setMine] = useState(note.userText);

  const chips: { id: Feeling; label: string }[] = [
    { id: "bien", label: t.feelOk },
    { id: "suave", label: t.feelSoft },
    { id: "pesada", label: t.feelHeavy },
    { id: "dolor", label: t.feelPain },
  ];

  function pickFeel(id: Feeling) {
    haptic();
    localSetFeeling(id);
    setFeeling(id);
  }

  return (
    <section className="relative mt-6 rounded-[1.75rem] bg-surface p-5 shadow-card">
      <p className="text-xs font-semibold tracking-wide text-muted">{t.noteToday}</p>
      <h2 className="mt-1 font-display text-2xl font-semibold tracking-[-0.03em]">{note.title}</h2>
      <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-fg">{note.body}</p>
      <button type="button" onClick={onAsk} className="mt-4 text-left text-sm font-medium text-primary">
        {note.ask}
      </button>

      <a
        href={songListenUrl(song)}
        target="_blank"
        rel="noreferrer"
        className="press mt-5 block w-full rounded-[1.25rem] bg-plum p-4 text-left text-primary-fg"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-80">{t.playsToday}</p>
        <p className="mt-1 font-display text-xl font-semibold leading-snug">
          {song.artist} — {song.title}
        </p>
        <p className="mt-1 text-sm opacity-90">{song.why}</p>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide">{t.listen}</p>
      </a>

      <p className="mt-6 text-sm font-semibold">{t.howMorning}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {chips.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => pickFeel(c.id)}
            className={cn(
              "press h-11 rounded-full px-4 text-sm font-semibold",
              feeling === c.id ? "bg-primary text-primary-fg" : "bg-bg text-fg",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      <label className="mt-6 block text-sm font-semibold" htmlFor="my-note">
        {t.yourNote}
      </label>
      <textarea
        id="my-note"
        className="mt-2 min-h-20 w-full resize-none rounded-2xl bg-bg px-4 py-3 text-sm leading-relaxed outline-none"
        placeholder={t.yourNoteHint}
        value={mine}
        maxLength={400}
        onChange={(e) => {
          setMine(e.target.value);
          localSetUserNote(e.target.value);
        }}
      />
    </section>
  );
}
