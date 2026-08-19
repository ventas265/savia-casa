import { Link } from "@tanstack/react-router";
import { BookOpen, CalendarDays, CircleDot, Sun, Menu } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type TabKey = "cal" | "hoy" | "log" | "guia" | "mas";

export function tabItems(t: ReturnType<typeof useI18n>["t"]) {
  return [
    { key: "hoy" as const, to: "/app/hoy" as const, label: t.today, icon: Sun },
    { key: "cal" as const, to: "/app" as const, label: t.navCal, icon: CalendarDays },
    { key: "log" as const, to: "/app/registro" as const, label: t.log, icon: CircleDot },
    { key: "guia" as const, to: "/app/guia" as const, label: t.library, icon: BookOpen },
    { key: "mas" as const, to: "/app/mas" as const, label: t.more, icon: Menu },
  ];
}

export function TabBar({
  current,
  onPick,
}: {
  current: TabKey;
  onPick?: (key: TabKey) => void;
}) {
  const { t } = useI18n();
  const items = tabItems(t);
  return (
    <nav className="border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = current === item.key;
          const className = cn(
            "flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs",
            active ? "font-semibold text-primary" : "text-muted",
          );
          const icon = (
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-full",
                active && "bg-primary/15",
              )}
            >
              <Icon className="size-5" strokeWidth={active ? 2.4 : 1.8} />
            </span>
          );
          if (onPick) {
            return (
              <button key={item.key} type="button" className={className} onClick={() => onPick(item.key)}>
                {icon}
                {item.label}
              </button>
            );
          }
          return (
            <Link key={item.key} to={item.to} className={className}>
              {icon}
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
