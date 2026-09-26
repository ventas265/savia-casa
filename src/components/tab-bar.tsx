import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { MessageCircleHeart, Orbit, Sparkle, UserRound } from "lucide-react";

export type TabKey = "hoy" | "cal" | "ia" | "tu";

export function tabItems(t: ReturnType<typeof useI18n>["t"]) {
  return [
    { key: "hoy" as const, to: "/app/hoy" as const, label: t.today, icon: Sparkle },
    { key: "cal" as const, to: "/app/calendario" as const, label: t.navCal, icon: Orbit },
    { key: "ia" as const, to: "/app/preguntar" as const, label: t.navAi, icon: MessageCircleHeart },
    { key: "tu" as const, to: "/app/tu" as const, label: t.navYou, icon: UserRound },
  ];
}

export function TabBar({ current }: { current: TabKey }) {
  const { t } = useI18n();
  const items = tabItems(t);
  return (
    <nav className="px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]" aria-label={t.navMainAria}>
      <div className="glass-strong grid h-16 grid-cols-4 items-center rounded-[32px] shadow-bar">
        {items.map((item) => {
          const Icon = item.icon;
          const active = current === item.key;
          return (
            <Link
              key={item.key}
              to={item.to}
              preload="intent"
              aria-current={active ? "page" : undefined}
              data-tab={item.key}
              className={cn(
                "relative z-10 flex h-16 flex-col items-center justify-center gap-[3px] text-[10.5px] font-medium leading-tight transition-colors",
                active ? "text-white" : "text-muted",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                  active && "bg-white/[0.09]",
                )}
              >
                <Icon className="size-[21px]" strokeWidth={active ? 1.8 : 1.5} />
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
