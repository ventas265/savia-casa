import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const S_PATH =
  "M20.8 7.2c-1.6-1.7-4.4-2.5-7.1-1.6-2.6.9-4.2 3.2-3.8 5.6.4 2.4 2.6 3.5 5.1 4.6 2.2 1 4.6 2.1 5 4.3.4 2.3-1.3 4.6-4.2 5.2-2.6.5-5.3-.4-6.6-2.4-.4-.6-1.3-.7-1.8-.2l-.7.7c-.5.5-.4 1.3.2 1.8 2 2.8 5.7 4.1 9.2 3.4 4.2-.8 7-4.2 6.4-8.1-.5-3.3-3.3-4.9-6.1-6.1-2.3-1-4.2-1.9-4.5-3.6-.3-1.5.7-2.9 2.4-3.4 1.7-.5 3.6 0 4.5 1.3.3.5 1 .7 1.5.3l.8-.6c.6-.4.7-1.2.2-1.7z";

/** Nocturna brand mark: gradient S on a dark glass tile. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("glass grid size-8 place-items-center rounded-[0.65rem]", className)} aria-hidden>
      <svg viewBox="0 0 32 32" className="size-[72%]">
        <defs>
          <linearGradient id="brand-s" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f2427e" />
            <stop offset="1" stopColor="#b65cff" />
          </linearGradient>
        </defs>
        <path fill="url(#brand-s)" d={S_PATH} />
      </svg>
    </span>
  );
}

export function BrandLockup({ to = "/app/hoy" }: { to?: "/app/hoy" | "/app/calendario" | "/" }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 text-fg">
      <BrandMark />
      <span className="font-display text-[1.3rem] font-semibold leading-none tracking-[-0.04em]">Savia</span>
    </Link>
  );
}
