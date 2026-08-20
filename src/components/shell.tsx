import type { ReactNode } from "react";
import { AskFab } from "@/components/ask-fab";
import { ColorBlobs } from "@/components/color-blobs";

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
      <div className="relative mx-auto min-h-dvh w-full max-w-lg overflow-hidden bg-bg">
        <ColorBlobs />
        <header className="sticky top-0 z-20 bg-bg/75 backdrop-blur">{header}</header>
        <main className={footer ? "relative px-4 py-4 pb-28" : "relative px-4 py-4"}>{children}</main>
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
