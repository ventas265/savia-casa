import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { TONE_CLS, type ChipTone } from "@/lib/symptom-meta";
import { cn } from "@/lib/utils";

/** Flo-style chip: colored circle with icon, label below, ring + check when on. */
export function CircleChip({
  label,
  icon,
  on,
  tone = "rose",
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
  circleClassName?: string;
}) {
  const c = TONE_CLS[tone];
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
          "relative flex items-center justify-center rounded-full text-2xl leading-none transition-[background-color,box-shadow] duration-200",
          size === "md" ? "size-14" : "size-[3.25rem]",
          on ? cn(c.on, "ring-[2.5px] ring-select-ring ring-offset-2 ring-offset-surface") : c.idle,
          circleClassName,
        )}
      >
        <span aria-hidden>{icon}</span>
        {on ? (
          <span className="absolute -right-0.5 -bottom-0.5 flex size-5 items-center justify-center rounded-full bg-select-ring text-surface shadow-soft">
            <Check className="size-3" strokeWidth={3} />
          </span>
        ) : null}
      </span>
      <span
        className={cn(
          "line-clamp-2 min-h-[2rem] text-[11px] leading-tight",
          on ? "font-bold text-fg" : "font-medium text-muted",
        )}
      >
        {label}
      </span>
    </button>
  );
}
