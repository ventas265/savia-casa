import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-[1.6rem] bg-surface p-5 shadow-card", className)}
      {...props}
    />
  );
}
