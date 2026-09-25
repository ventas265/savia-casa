import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const styles = {
  draft: "bg-surface-2 text-muted",
  sent: "bg-primary/10 text-primary",
  accepted: "bg-grad text-primary-fg",
  paid: "bg-ink text-primary-fg",
  declined: "bg-danger/10 text-danger",
  expired: "bg-surface-2 text-muted",
  default: "bg-surface-2 text-fg",
};

export function Badge({
  className,
  tone = "default",
  ...props
}: ComponentProps<"span"> & { tone?: keyof typeof styles }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium capitalize",
        styles[tone],
        className,
      )}
      {...props}
    />
  );
}
