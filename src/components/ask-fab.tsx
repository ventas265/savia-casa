import { Link, useRouterState } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Speech + spark: “talk to Savia”. */
export function AskGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-7", className)} fill="none" aria-hidden>
      <path
        d="M25.8 2.2 27 6.2 31 7.4 27 8.6 25.8 12.6 24.6 8.6 20.6 7.4 24.6 6.2Z"
        fill="currentColor"
      />
      <path
        d="M4.5 10.2c0-3.3 2.7-6 6-6h9.2c3.3 0 6 2.7 6 6v7.4c0 3.3-2.7 6-6 6h-3.4l-5.1 4.1c-.6.5-1.5.1-1.5-.8v-3.3h-.2c-3.3 0-6-2.7-6-6v-7.4Z"
        fill="currentColor"
      />
      <circle cx="11.2" cy="13.8" r="1.55" className="fill-primary" />
      <circle cx="16.1" cy="13.8" r="1.55" className="fill-primary" />
      <circle cx="21" cy="13.8" r="1.55" className="fill-primary" />
    </svg>
  );
}

export function AskFab() {
  const { t } = useI18n();
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (path.startsWith("/app/preguntar")) return null;
  return (
    <div className="pointer-events-none fixed bottom-0 left-1/2 z-30 w-full max-w-lg -translate-x-1/2 md:max-w-[28rem]">
      <Link
        to="/app/preguntar"
        aria-label={t.askTalk}
        className="pointer-events-auto absolute right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] flex size-16 items-center justify-center rounded-full bg-primary text-primary-fg shadow-card ring-4 ring-primary/25"
      >
        <AskGlyph className="size-9" />
      </Link>
    </div>
  );
}
