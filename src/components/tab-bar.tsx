import { Link, useNavigate } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { getSelectedDay } from "@/lib/selected-day";
import { Grip, Heart, Orbit, Plus, Sparkle } from "lucide-react";

export type TabKey = "cal" | "hoy" | "log" | "sexo" | "mas";

export function tabItems(t: ReturnType<typeof useI18n>["t"]) {
  return [
    { key: "hoy" as const, to: "/app/hoy" as const, label: t.today, icon: Sparkle },
    { key: "cal" as const, to: "/app/calendario" as const, label: t.navCal, icon: Orbit },
    { key: "log" as const, to: "/app/registro" as const, label: t.log, icon: Plus, plus: true },
    { key: "sexo" as const, to: "/app/sexo" as const, label: t.navSex, icon: Heart },
    { key: "mas" as const, to: "/app/mas" as const, label: t.more, icon: Grip },
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
  const navigate = useNavigate();
  const items = tabItems(t);
  return (
    <nav className="px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div className="glass-strong grid h-16 grid-cols-5 items-center rounded-[32px] shadow-bar">
        {items.map((item) => {
          const Icon = item.icon;
          const active = current === item.key;
          const plus = "plus" in item && item.plus;
          const className = cn(
            "relative z-10 flex h-16 flex-col items-center justify-center gap-[3px] text-[10px] font-medium leading-tight transition-colors",
            plus && "z-20",
            active && !plus ? "text-white" : "text-muted",
          );
          const icon = plus ? (
            <span className="bg-grad flex size-[46px] items-center justify-center rounded-full text-white shadow-[0_6px_20px_rgb(255_79_123/0.5)]">
              <Icon className="size-[22px]" strokeWidth={2} />
            </span>
          ) : (
            <span className="flex size-6 items-center justify-center">
              <Icon className="size-[21px]" strokeWidth={active ? 1.8 : 1.5} />
            </span>
          );
          const label = plus ? (
            <span className="sr-only">{item.label}</span>
          ) : (
            item.label
          );
          if (onPick) {
            return (
              <button
                key={item.key}
                type="button"
                className={className}
                onClick={() => onPick(item.key)}
                aria-label={plus ? item.label : undefined}
                title={plus ? item.label : undefined}
              >
                {icon}
                {label}
              </button>
            );
          }
          if (item.key === "log") {
            return (
              <Link
                key={item.key}
                to="/app/registro"
                preload="intent"
                className={className}
                aria-label={item.label}
                title={item.label}
                onClick={(e) => {
                  const day = getSelectedDay();
                  if (!day) return;
                  e.preventDefault();
                  void navigate({ to: "/app/registro", search: { day } });
                }}
              >
                {icon}
                {label}
              </Link>
            );
          }
          return (
            <Link
              key={item.key}
              to={item.to}
              preload="intent"
              className={className}
            >
              {icon}
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
