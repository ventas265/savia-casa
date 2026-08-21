import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <img
      src="/icon-192.png"
      alt=""
      className={cn("size-9 rounded-[0.7rem] shadow-border", className)}
    />
  );
}

export function BrandLockup({ to = "/app/hoy" }: { to?: "/app/hoy" | "/app/calendario" | "/" }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 text-primary">
      <BrandMark />
      <span className="font-display text-[1.4rem] font-semibold leading-none tracking-[-0.03em]">Savia</span>
    </Link>
  );
}
