import { useI18n } from "@/lib/i18n";

export function LangToggle() {
  const { lang, setLang, t } = useI18n();
  return (
    <div className="glass flex h-10 items-center rounded-full p-0.5 text-xs font-medium">
      <span className="sr-only">{t.language}</span>
      <button
        type="button"
        className={`rounded-full px-2.5 py-1 ${lang === "es" ? "bg-white/90 text-[#130d12]" : "text-muted"}`}
        onClick={() => setLang("es")}
      >
        ES
      </button>
      <button
        type="button"
        className={`rounded-full px-2.5 py-1 ${lang === "en" ? "bg-white/90 text-[#130d12]" : "text-muted"}`}
        onClick={() => setLang("en")}
      >
        EN
      </button>
    </div>
  );
}
