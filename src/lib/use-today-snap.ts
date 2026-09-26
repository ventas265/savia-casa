import { useEffect, useState } from "react";
import { loadToday } from "@/lib/savia-api";
import { SAVIA_BETA } from "@/lib/beta";
import { localToday } from "@/lib/savia-local";
import type { TodaySnapshot } from "@/lib/types";

/** Same load pattern as Hoy/Calendario: local snapshot first (beta), then remote refresh. Never during SSR. */
export function useTodaySnap() {
  const [data, setData] = useState<TodaySnapshot | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    if (SAVIA_BETA) {
      setData(localToday());
      setReady(true);
    }
    loadToday()
      .then((snap) => {
        if (alive) setData(snap);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);
  return { data, ready, setData };
}
