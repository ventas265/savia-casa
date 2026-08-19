import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { AuthSlot } from "@/components/auth-slot";
import { LangToggle } from "@/components/lang-toggle";
import { TabBar, type TabKey } from "@/components/tab-bar";
import { Shell } from "@/components/shell";

export function AppShell({
  children,
  current,
}: {
  children: ReactNode;
  current: TabKey | "other";
}) {
  const { t } = useI18n();
  return (
    <Shell
      header={
        <div className="flex h-14 items-center justify-between gap-3 px-4">
          <Link to="/app/hoy" className="text-lg font-semibold tracking-tight">
            {t.brand}
          </Link>
          <div className="flex items-center gap-2">
            <LangToggle />
            <AuthSlot compact />
          </div>
        </div>
      }
      footer={current !== "other" ? <TabBar current={current} /> : undefined}
    >
      {children}
    </Shell>
  );
}
