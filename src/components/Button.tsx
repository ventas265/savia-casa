import type { ButtonHTMLAttributes } from "react";

type V = "primary" | "secondary" | "tertiary";
const cls: Record<V, string> = {
  primary: "h-[52px] w-full rounded-[14px] bg-[var(--granada)] px-5 text-[16px] font-semibold text-white",
  secondary: "h-[52px] w-full rounded-[14px] border border-[var(--cacao)] bg-transparent px-5 text-[16px] font-semibold text-[var(--cacao)]",
  tertiary: "min-h-11 px-1 text-[15px] font-semibold text-[var(--granada)] hover:underline underline-offset-4",
};

export function Button({ variant = "primary", className = "", ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: V }) {
  return <button type="button" {...p} className={`${cls[variant]} disabled:opacity-40 ${className}`} />;
}
