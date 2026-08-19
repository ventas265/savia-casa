import { Link, useRouterState } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Chat + guide face: the mark that means “ask Savia, not Google”. */
export function AskGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-7", className)}
      fill="none"
      aria-hidden
    >
      <path
        d="M6 10.5c0-2.5 2-4.5 4.5-4.5h11c2.5 0 4.5 2 4.5 4.5v8c0 2.5-2 4.5-4.5 4.5H16l-4.2 3.6c-.6.5-1.5.1-1.5-.7V23H10.5C8 23 6 21 6 18.5v-8Z"
        fill="currentColor"
      />
      <circle cx="13" cy="15" r="1.35" className="fill-primary" />
      <circle cx="19" cy="15" r="1.35" className="fill-primary" />
      <path
        d="M13.2 18.2c.9.9 4.7.9 5.6 0"
        stroke="var(--color-primary)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="16" cy="4.2" r="1.3" fill="currentColor" />
      <path d="M16 5.5v1.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function AskFab() {
  const { t } = useI18n();
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (path.startsWith("/app/preguntar")) return null;
  return (
    <div className="pointer-events-none fixed bottom-0 left-1/2 z-30 w-full max-w-lg -translate-x-1/2">
      <Link
        to="/app/preguntar"
        aria-label={t.askTalk}
        className="pointer-events-auto absolute right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] flex size-14 items-center justify-center rounded-full bg-primary text-primary-fg shadow-md"
      >
        <AskGlyph className="size-8" />
      </Link>
    </div>
  );
}
