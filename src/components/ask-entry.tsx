import { Link, useRouterState } from "@tanstack/react-router";
import { AskGlyph } from "@/components/ask-fab";
import { useI18n } from "@/lib/i18n";

export function AskHeader() {
  const { t } = useI18n();
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (path.startsWith("/app/preguntar")) return null;
  return (
    <Link
      to="/app/preguntar"
      aria-label={t.askTalk}
      className="press flex h-10 items-center gap-1.5 rounded-full bg-primary px-3 text-primary-fg"
    >
      <AskGlyph className="size-5 text-primary-fg" />
      <span className="text-xs font-semibold">{t.askMark}</span>
    </Link>
  );
}

export function AskComposer() {
  const { t } = useI18n();
  return (
    <Link
      to="/app/preguntar"
      className="press mt-6 flex h-14 items-center gap-3 rounded-full bg-surface px-4 shadow-card"
    >
      <AskGlyph className="size-6 text-primary" />
      <span className="text-sm text-muted">{t.askHint}</span>
    </Link>
  );
}
