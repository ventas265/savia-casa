import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { useV4 } from "@/lib/i18n-v4";
import { CalendarDays, House, MessageCircle, Sparkles } from "lucide-react";

/** v4: Hoy · Calendario · Patrones · Savia. «tu» (perfil) opens from the avatar and highlights no tab. */
export type TabKey = "hoy" | "cal" | "pat" | "ia" | "tu";

export function tabItems(v: ReturnType<typeof useV4>["v"]) {
  return [
    { key: "hoy" as const, to: "/app/hoy" as const, label: v.tabHoy, icon: House },
    { key: "cal" as const, to: "/app/calendario" as const, label: v.tabCal, icon: CalendarDays },
    { key: "pat" as const, to: "/app/patrones" as const, label: v.tabPat, icon: Sparkles },
    { key: "ia" as const, to: "/app/preguntar" as const, label: v.tabSavia, icon: MessageCircle },
  ];
}

export function TabBar({ current, patternsDot = false }: { current: TabKey; patternsDot?: boolean }) {
  const { t } = useI18n();
  const { v } = useV4();
  const items = tabItems(v);
  return (
    <nav className="v4-tabbar" aria-label={t.navMainAria}>
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
            className="v4-tab"
          >
            <span className="v4-ti">
              <Icon className="size-[23px]" strokeWidth={active ? 2 : 1.6} aria-hidden />
              {item.key === "pat" && patternsDot && !active ? <i className="v4-badge" aria-label={v.tabNew} /> : null}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
