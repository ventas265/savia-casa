import { useEffect, useState } from "react";
import { todayISO } from "@/lib/cycle";

/**
 * Browser-local calendar "today" (YYYY-MM-DD).
 * null until mount so SSR (UTC) cannot paint the wrong Hoy mark.
 */
export function useClientTodayISO() {
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => {
    setToday(todayISO());
  }, []);
  return today;
}
