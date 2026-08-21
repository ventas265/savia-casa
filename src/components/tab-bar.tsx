import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { IconCal, IconGuia, IconHoy, IconMas, IconPlus } from "@/components/savia-icons";

export type TabKey = "cal" | "hoy" | "log" | "guia" | "mas";

export function tabItems(t: ReturnType<typeof useI18n>["t"]) {
  return [
    { key: "hoy" as const, to: "/app/hoy" as const, label: t.today, icon: IconHoy },
    { key: "cal" as const, to: "/app/calendario" as const, label: t.navCal, icon: IconCal },
    { key: "log" as const, to: "/app/registro" as const, label: t.log, icon: IconPlus, plus: true },
    { key: "guia" as const, to: "/app/guia" as const, label: t.library, icon: IconGuia },
    { key: "mas" as const, to: "/app/mas" as const, label: t.more, icon: IconMas },
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
    <nav className="border-t border-border/70 bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5 items-end">
        {items.map((item) => {
          const Icon = item.icon;
          const active = current === item.key;
          const plus = "plus" in item && item.plus;
          const className = cn(
            "relative z-10 flex min-h-16 flex-col items-center justify-end gap-0.5 pb-2 text-[10px] font-semibold",
            plus && "z-20",
            active && !plus ? "text-primary" : "text-muted",
          );
          const icon = plus ? (
            <span className="plus-live -mt-5 mb-1 flex size-14 items-center justify-center rounded-full bg-primary text-primary-fg shadow-card">
              <Icon className="size-7" />
            </span>
          ) : (
            <span className={cn("flex size-8 items-center justify-center", active && "text-primary")}>
              <Icon className="size-[22px]" />
            </span>
          );
          if (onPick) {
            return (
              <button key={item.key} type="button" className={className} onClick={() => onPick(item.key)}>
                {icon}
                {plus ? "" : item.label}
              </button>
            );
          }
          return (
            <Link key={item.key} to={item.to} preload="intent" className={className}>
              {icon}
              {plus ? "" : item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
