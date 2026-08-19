import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]", className)}
      {...props}
    />
  );
}
