import { useI18n } from "@/lib/i18n";

export function LangToggle() {
  const { lang, setLang, t } = useI18n();
  return (
    <div className="flex h-11 items-center rounded-full border border-border bg-surface p-0.5 text-xs font-medium">
      <span className="sr-only">{t.language}</span>
      <button
        type="button"
        className={`rounded-full px-2.5 py-1 ${lang === "es" ? "bg-ink text-primary-fg" : "text-muted"}`}
        onClick={() => setLang("es")}
      >
        ES
      </button>
      <button
        type="button"
        className={`rounded-full px-2.5 py-1 ${lang === "en" ? "bg-ink text-primary-fg" : "text-muted"}`}
        onClick={() => setLang("en")}
      >
        EN
      </button>
    </div>
  );
}
