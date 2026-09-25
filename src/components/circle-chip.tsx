import type { ReactNode } from "react";
import { Check } from "lucide-react";
import type { ChipTone } from "@/lib/symptom-meta";
import { cn } from "@/lib/utils";

/** Nocturna chip: dark glass circle + thin line icon; selected = gradient fill + glow. */
export function CircleChip({
  label,
  icon,
  on,
  onClick,
  size = "md",
  circleClassName,
}: {
  label: string;
  icon: ReactNode;
  on: boolean;
  tone?: ChipTone;
  onClick: () => void;
  size?: "md" | "sm";
  /** Extra classes for the idle circle (e.g. icon tint). Ignored when selected. */
  circleClassName?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "press group flex flex-col items-center gap-1.5 text-center",
        size === "md" ? "w-[4.5rem]" : "w-[3.9rem] shrink-0",
      )}
    >
      <span
        className={cn(
          "relative flex items-center justify-center rounded-full leading-none transition-[background-color,box-shadow,color] duration-200",
          size === "md" ? "size-14" : "size-[3.25rem]",
          on
            ? "bg-grad text-primary-fg shadow-[0_6px_22px_-4px_rgb(242_66_126/0.65)]"
            : cn("bg-white/[0.055] text-fg/85 ring-1 ring-white/10 backdrop-blur-md", circleClassName),
        )}
      >
        <span aria-hidden className="flex items-center justify-center">
          {icon}
        </span>
        {on ? (
          <span className="absolute -right-0.5 -bottom-0.5 flex size-5 items-center justify-center rounded-full bg-white text-[#130d12] ring-2 ring-[#1b131e]">
            <Check className="size-3" strokeWidth={3} />
          </span>
        ) : null}
      </span>
      <span
        className={cn(
          "line-clamp-2 min-h-[2rem] text-[11px] leading-tight",
          on ? "font-semibold text-fg" : "font-medium text-muted",
        )}
      >
        {label}
      </span>
    </button>
  );
}
