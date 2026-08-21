import { useI18n } from "@/lib/i18n";
import { cyclePattern } from "@/lib/cycle";

export function PatternStrip({ starts, fallback }: { starts: string[]; fallback: number }) {
  const { t } = useI18n();
  const p = cyclePattern(starts, fallback);
  return (
    <div className="relative mt-6 grid grid-cols-3 gap-2">
      <Stat k={t.yourAvg} v={`${p.avg}`} s={t.days} />
      <Stat k={t.yourVar} v={p.n ? `±${Math.max(1, Math.round(p.variation / 2))}` : "—"} s={t.days} />
      <Stat k={t.cyclesN} v={`${p.n || starts.length}`} s={t.logged} />
    </div>
  );
}

function Stat({ k, v, s }: { k: string; v: string; s: string }) {
  return (
    <div className="rounded-[1.25rem] bg-surface px-2 py-3 text-center shadow-card">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{k}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-primary">{v}</p>
      <p className="text-[11px] text-muted">{s}</p>
    </div>
  );
}
