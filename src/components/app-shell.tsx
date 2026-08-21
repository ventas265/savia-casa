import type { ReactNode } from "react";
import { AuthSlot } from "@/components/auth-slot";
import { LangToggle } from "@/components/lang-toggle";
import { TabBar, type TabKey } from "@/components/tab-bar";
import { Shell } from "@/components/shell";
import { BrandLockup } from "@/components/brand-mark";
import { SAVIA_BETA } from "@/lib/beta";

export function AppShell({
  children,
  current,
}: {
  children: ReactNode;
  current: TabKey | "other";
}) {
  return (
    <Shell
      header={
        <div className="flex h-14 items-center justify-between gap-3 px-4">
          <BrandLockup />
          <div className="flex items-center gap-2">
            <LangToggle />
            {SAVIA_BETA ? null : <AuthSlot compact />}
          </div>
        </div>
      }
      footer={current !== "other" ? <TabBar current={current} /> : undefined}
    >
      {children}
    </Shell>
  );
}
