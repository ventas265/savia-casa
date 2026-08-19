import type { ReactNode } from "react";
import { AskFab } from "@/components/ask-fab";

export function Shell({
  header,
  children,
  footer,
  ask = false,
}: {
  header: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  ask?: boolean;
}) {
  return (
    <div className="min-h-dvh bg-bg">
      <div className="relative mx-auto min-h-dvh w-full max-w-lg bg-bg">
        <header className="sticky top-0 z-20 bg-bg/90 backdrop-blur">{header}</header>
        <main className={footer ? "px-4 py-4 pb-28" : "px-4 py-4"}>{children}</main>
        {footer ? (
          <div className="fixed bottom-0 left-1/2 z-20 w-full max-w-lg -translate-x-1/2">
            {footer}
          </div>
        ) : null}
        {ask ? <AskFab /> : null}
      </div>
    </div>
  );
}
