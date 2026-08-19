import { disclaimer, pick } from "@/lib/savia-content";
import { useI18n } from "@/lib/i18n";

export function Disclaimer({ compact = false }: { compact?: boolean }) {
  const { lang } = useI18n();
  return (
    <p className={compact ? "text-xs leading-relaxed text-muted" : "text-sm leading-relaxed text-muted"}>
      {pick(disclaimer, lang)}
    </p>
  );
}
