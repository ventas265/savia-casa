import type { ReactNode } from "react";
import { AskFab } from "@/components/ask-fab";

/** Phone column: mobile max-w-lg, desktop slightly wider (~448px). */
const APP_COL = "w-full max-w-lg md:max-w-[28rem]";

export function Shell({
  header,
  children,
  footer,
  ask = false,
}: {
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  ask?: boolean;
}) {
  return (
    <div className="min-h-dvh">
      <div className={`relative mx-auto min-h-dvh overflow-x-hidden bg-transparent ${APP_COL}`}>
        {header ? <header className="sticky top-0 z-20 bg-bg/70 backdrop-blur-xl">{header}</header> : null}
        <main className={footer ? "relative px-4 py-4 pb-32" : "relative px-4 py-4"}>{children}</main>
        {footer ? (
          <div className={`fixed bottom-0 left-1/2 z-20 -translate-x-1/2 ${APP_COL}`}>
            {footer}
          </div>
        ) : null}
        {ask ? <AskFab /> : null}
      </div>
    </div>
  );
}
