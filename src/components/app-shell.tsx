import { useEffect, type ReactNode } from "react";
import { useSerenaSheet } from "@/lib/serena-sheet";
import { TabBar, type TabKey } from "@/components/tab-bar";
import { Shell } from "@/components/shell";
import { SerenaSheet } from "@/components/v4/serena-sheet";
import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { LangToggle } from "@/components/lang-toggle";
import { useV4 } from "@/lib/i18n-v4";

function BackBar() {
  const { v } = useV4();
  return (
    <div className="flex h-14 items-center justify-between gap-3 px-3">
      <Link to="/app/hoy" aria-label={v.back} className="v4-ib">
        <ChevronLeft className="size-5" strokeWidth={1.8} aria-hidden />
      </Link>
      <LangToggle />
    </div>
  );
}

/**
 * v4: the four tab screens draw their own headers (Hoy greeting, month title, «Patrones», chat header).
 * Profile (/app/tu) and guides are reached from the avatar and keep the tab bar with no tab active.
 */
export function AppShell({
  children,
  current,
  patternsDot = false,
}: {
  children: ReactNode;
  current: TabKey | "other";
  patternsDot?: boolean;
}) {
  const showSerena = useSerenaSheet((s) => s.show);
  // Deep link: any /app screen with ?serena=1 opens the Serena sheet over it.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("serena") === "1") showSerena();
  }, [showSerena]);
  return (
    <Shell
      header={current === "tu" ? <BackBar /> : undefined}
      footer={current !== "other" ? <TabBar current={current} patternsDot={patternsDot} /> : undefined}>
      {children}
      <SerenaSheet />
    </Shell>
  );
}
