import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/color-blobs";
import { listTesters } from "@/lib/testers";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/app/cuadernos")({ component: Cuadernos });

function Cuadernos() {
  const { t } = useI18n();
  const [pin, setPin] = useState("");
  const [err, setErr] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [rows, setRows] = useState<{ display_name: string; stage: string; country: string; last_seen: string }[]>([]);

  async function open() {
    setErr(false);
    const res = await listTesters({ data: { pin } });
    if (!res.ok) {
      setErr(true);
      return;
    }
    setCount(res.count);
    setRows(res.rows);
  }

  return (
    <div>
      <PageTitle title={t.booksTitle} />
      <p className="mt-2 text-sm text-muted">{t.booksHint}</p>
      {count == null ? (
        <form
          className="mt-6 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void open();
          }}
        >
          <input
            type="password"
            className="h-12 w-full rounded-full bg-surface px-4 text-sm outline-none"
            placeholder={t.booksPin}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
          {err ? <p className="text-sm text-primary">{t.booksBad}</p> : null}
          <Button type="submit" className="h-12 w-full rounded-full">
            {t.booksOpen}
          </Button>
        </form>
      ) : (
        <div className="mt-6">
          <p className="font-display text-4xl font-semibold">{count}</p>
          <p className="mt-1 text-sm text-muted">{t.booksCount}</p>
          <ul className="mt-6 space-y-2">
            {rows.map((r, i) => (
              <li key={`${r.display_name}-${i}`} className="flex justify-between rounded-2xl bg-surface px-4 py-3 text-sm">
                <span className="font-semibold">{r.display_name || "—"}</span>
                <span className="text-muted">
                  {r.stage} · {r.country}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
