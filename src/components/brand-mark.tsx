import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

/** Leaf-drop: sap, not a blood drop. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <path
        d="M16 3.2C16 3.2 7.2 13.4 7.2 20.2a8.8 8.8 0 1 0 17.6 0C24.8 13.4 16 3.2 16 3.2Z"
        fill="currentColor"
      />
      <path
        d="M16 11.2c.2 3.4 4.6 5.4 4.6 9 0 2.5-2 4.4-4.6 4.4"
        fill="none"
        stroke="#fff"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BrandLockup({ to = "/app/hoy" }: { to?: "/app/hoy" | "/" }) {
  return (
    <Link to={to} className="flex items-center gap-2 text-primary">
      <BrandMark className="size-7" />
      <span className="text-lg font-extrabold tracking-tight">Savia</span>
    </Link>
  );
}
