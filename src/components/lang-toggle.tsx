import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** ES/EN switch: each option is a 44px touch target. */
export function LangToggle() {
  const { lang, setLang, t } = useI18n();
  return (
    <div role="group" aria-label={t.language} className="glass flex h-11 items-center rounded-full p-0.5 text-xs font-medium">
      {(["es", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={lang === l}
          aria-label={l === "es" ? "Español" : "English"}
          className={cn(
            "grid h-10 min-w-11 place-items-center rounded-full px-2.5",
            lang === l ? "bg-white/90 text-[#130d12]" : "text-muted",
          )}
          onClick={() => setLang(l)}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
