import { create } from "zustand";

/** Global «Serena» paywall sheet: opens over the current screen from Patrones or any locked feature. */
export const useSerenaSheet = create<{ open: boolean; show: () => void; hide: () => void }>((set) => ({
  open: false,
  show: () => set({ open: true }),
  hide: () => set({ open: false }),
}));
