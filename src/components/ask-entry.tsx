import { Link, useRouterState } from "@tanstack/react-router";
import { AskGlyph } from "@/components/ask-fab";
import { useI18n } from "@/lib/i18n";
import { SaviaOrb, useSaviaTone } from "@/components/savia-orb";

export function AskHeader() {
  const { t } = useI18n();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const tone = useSaviaTone();
  if (path.startsWith("/app/preguntar")) return null;
  return (
    <Link
      to="/app/preguntar"
      aria-label={t.askTalk}
      className="press glass flex h-10 items-center gap-2 rounded-full pl-1.5 pr-3.5 text-fg"
    >
      <SaviaOrb tone={tone} className="size-7" />
      <span className="text-xs font-semibold">{t.askMark}</span>
    </Link>
  );
}

export function AskComposer() {
  const { t } = useI18n();
  return (
    <Link
      to="/app/preguntar"
      className="press glass mt-6 flex h-14 items-center gap-3 rounded-full px-4"
    >
      <AskGlyph className="size-6 text-primary" />
      <span className="text-sm text-muted">{t.askHint}</span>
    </Link>
  );
}
