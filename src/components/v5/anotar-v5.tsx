import { useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { CaretDown, X } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Chip } from "@/components/Chip";
import { Button } from "@/components/Button";
import { writeLog } from "@/lib/savia-api";
import { draftFrom, toSaveInput, toggle, type Draft } from "@/lib/anotar";
import type { DailyLog } from "@/lib/types";

const CUERPO: [string, string][] = [
  ["cramps", "Cólicos"], ["headache", "Dolor de cabeza"], ["fatigue", "Cansancio"], ["bloating", "Hinchazón"],
  ["breast", "Pecho sensible"], ["acne", "Acné"], ["craving", "Antojos"], ["nausea", "Náusea"], ["backache", "Dolor de espalda"],
];
const ANIMO_SYM: [string, string][] = [["irritable", "Irritable"], ["anxiety", "Ansiosa"], ["low_mood", "Triste"]];
const LABEL: Record<string, string> = Object.fromEntries([...CUERPO, ...ANIMO_SYM, ["libido_up", "Libido alta"], ["insomnia", "Insomnio"], ["hot_flash", "Sofocos"]]);
const TAGS = { emergency: "[píldora de emergencia]", lh_test: "[test LH positivo]", preg_test: "[test de embarazo]" } as const;

function Group({ title, open, onToggle, children, dot }: { title: string; open: boolean; onToggle: () => void; children: ReactNode; dot: string }) {
  return (
    <section className="border-b border-[var(--linea)] py-1">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex min-h-12 w-full items-center justify-between text-left">
        <span className="flex items-center gap-2.5"><span className="size-2.5 rounded-full" style={{ background: dot }} /><span className="v5-h2 !text-[20px]">{title}</span></span>
        <CaretDown size={18} weight="light" style={{ transform: open ? "rotate(180deg)" : undefined }} aria-hidden />
      </button>
      {open ? <div className="flex flex-wrap gap-2 pb-4">{children}</div> : null}
    </section>
  );
}

export function AnotarV5({ day, cycleDay, log, recent, onClose, onSaved }: {
  day: string; cycleDay: number | null; log: DailyLog | null; recent: DailyLog[]; onClose: () => void; onSaved: () => void;
}) {
  const initial = useMemo(() => draftFrom(log), [log]);
  const [d, setD] = useState<Draft>(initial);
  const [open, setOpen] = useState<Record<string, boolean>>({ regla: true, sexo: true });
  const [temp, setTemp] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (p: Partial<Draft>) => setD((x) => ({ ...x, ...p }));
  const sym = (id: string) => set({ symptoms: toggle(d.symptoms, id) });
  const has = (id: string) => d.symptoms.includes(id);
  const tag = (k: keyof typeof TAGS) => d.notes.includes(TAGS[k]);
  const flipTag = (k: keyof typeof TAGS) => set({ notes: tag(k) ? d.notes.replace(TAGS[k], "").trim() : `${d.notes} ${TAGS[k]}`.trim() });
  const g = (k: string) => ({ open: Boolean(open[k]), onToggle: () => setOpen((o) => ({ ...o, [k]: !o[k] })) });

  const sugeridos = useMemo(() => {
    const c: Record<string, number> = {};
    for (const l of recent) for (const s of l.symptoms) if (LABEL[s]) c[s] = (c[s] || 0) + 1;
    const top = Object.entries(c).sort((a, b) => b[1] - a[1]).map(([k]) => k);
    return [...top, "cramps", "fatigue", "bloating"].filter((v, i, a) => a.indexOf(v) === i).slice(0, 3);
  }, [recent]);

  async function save() {
    setBusy(true);
    const notes = temp ? `${d.notes} [temp ${temp} °C]`.trim() : d.notes;
    try {
      const res = await writeLog(toSaveInput(day, { ...d, notes }));
      if (res.ok) {
        toast.success("Guardado · tus predicciones se actualizaron");
        onSaved();
        onClose();
      } else toast.error("No se pudo guardar. Intenta de nuevo.");
    } catch {
      toast.error("No se pudo guardar. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[rgb(42_30_26/0.4)]" role="dialog" aria-modal="true" aria-label="Anotar mi día">
      <div className="v5 glass !bg-[rgb(253_242_245/.94)] flex max-h-[94dvh] w-full max-w-[480px] flex-col rounded-t-[28px]">
        <div className="flex items-center justify-between px-5 pt-4">
          <h2 className="v5-h1 !text-[28px]">Anotar mi día</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="grid size-11 place-items-center"><X size={22} weight="light" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-4">
          <p className="v5-kicker mt-4">Sugeridos{cycleDay ? ` para tu día ${cycleDay}` : ""}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {sugeridos.map((s) => <Chip tone="ambar" key={s} id={s} label={LABEL[s]} selected={has(s)} onClick={() => sym(s)} />)}
          </div>
          <div className="mt-4">
            <Group title="Regla" dot="#8E2C3E" {...g("regla")}>
              <Chip tone="rosa" id="flow_light" label="Ligera" selected={d.flow === "light"} onClick={() => set({ flow: d.flow === "light" ? "none" : "light" })} />
              <Chip tone="rosa" id="flow_medium" label="Media" selected={d.flow === "medium"} onClick={() => set({ flow: d.flow === "medium" ? "none" : "medium" })} />
              <Chip tone="rosa" id="flow_heavy" label="Abundante" selected={d.flow === "heavy"} onClick={() => set({ flow: d.flow === "heavy" ? "none" : "heavy" })} />
              <Chip tone="rosa" id="spotting" label="Manchado" selected={d.flow === "spotting"} onClick={() => set({ flow: d.flow === "spotting" ? "none" : "spotting" })} />
            </Group>
            <Group title="Sexo y protección" dot="#C9566A" {...g("sexo")}>
              <Chip tone="rosa" id="unprotected" label="Sin protección" selected={d.sexKind === "unprotected"} onClick={() => set({ sexKind: d.sexKind === "unprotected" ? "none" : "unprotected" })} />
              <Chip tone="rosa" id="protected" label="Con condón" selected={d.sexKind === "protected"} onClick={() => set({ sexKind: d.sexKind === "protected" ? "none" : "protected" })} />
              <Chip tone="rosa" id="emergency" label="Píldora de emergencia" selected={tag("emergency")} onClick={() => flipTag("emergency")} />
              <Chip tone="rosa" id="preg_test" label="Test de embarazo" selected={tag("preg_test")} onClick={() => flipTag("preg_test")} />
              {d.sexKind === "unprotected" ? (
                <div className="v5-card mt-2 w-full !p-4" style={{ borderColor: "var(--granada)" }}>
                  <p className="text-[15px] font-semibold">¿Fue hace menos de 5 días?</p>
                  <p className="mt-1 text-[14px] v5-muted">La anticoncepción de emergencia puede ayudar. Cuanto antes, mejor.</p>
                  <Link to="/app/proteccion" hash="emergencia" className="mt-2 inline-flex min-h-11 items-center text-[15px] font-semibold text-[var(--granada)] underline underline-offset-4">Ver opciones</Link>
                </div>
              ) : null}
            </Group>
            <Group title="Cuerpo" dot="#B07A3C" {...g("cuerpo")}>
              {CUERPO.map(([id, l]) => <Chip tone="ambar" key={id} id={id} label={l} selected={has(id)} onClick={() => sym(id)} />)}
            </Group>
            <Group title="Ánimo" dot="#6E3B5C" {...g("animo")}>
              <Chip tone="ciruela" id="calm" label="Tranquila" selected={d.mood === 4} onClick={() => set({ mood: d.mood === 4 ? null : 4 })} />
              <Chip tone="ciruela" id="sensitive" label="Sensible" selected={d.mood === 2} onClick={() => set({ mood: d.mood === 2 ? null : 2 })} />
              {ANIMO_SYM.map(([id, l]) => <Chip tone="ciruela" key={id} id={id} label={l} selected={has(id)} onClick={() => sym(id)} />)}
              <Chip tone="ciruela" id="energy" label="Con energía" selected={d.energy === 4} onClick={() => set({ energy: d.energy === 4 ? null : 4 })} />
            </Group>
            <Group title="Flujo" dot="#3F6B5E" {...g("flujo")}>
              {([["eggwhite", "Clara de huevo"], ["creamy", "Cremoso"], ["sticky", "Pegajoso"]] as const).map(([m, l]) => (
                <Chip tone="salvia" key={m} id="discharge" label={l} selected={d.mucus === m} onClick={() => set({ mucus: d.mucus === m ? "none" : m })} />
              ))}
              <Chip tone="salvia" id="dryness" label="Seco" selected={has("dryness")} onClick={() => sym("dryness")} />
            </Group>
            <Group title="Medidas" dot="#3F6B5E" {...g("medidas")}>
              <label className="flex min-h-11 items-center gap-2 rounded-full border border-[var(--linea)] bg-white px-4 text-[14px]">
                Temperatura
                <input inputMode="decimal" value={temp} onChange={(e) => setTemp(e.target.value.replace(/[^\d.,]/g, "").slice(0, 5))} placeholder="36,5" className="w-14 bg-transparent outline-none" aria-label="Temperatura basal en °C" /> °C
              </label>
              <Chip tone="salvia" id="lh_test" label="Test LH positivo" selected={tag("lh_test")} onClick={() => flipTag("lh_test")} />
              {[6, 7, 8].map((h) => <Chip tone="salvia" key={h} id="sleep" label={`Dormí ${h} h`} selected={d.sleepHours === h} onClick={() => set({ sleepHours: d.sleepHours === h ? null : h })} />)}
            </Group>
            <Group title="Notas" dot="#B07A3C" {...g("notas")}>
              <textarea value={d.notes} onChange={(e) => set({ notes: e.target.value.slice(0, 500) })} rows={3} placeholder="Algo que quieras recordar" className="w-full rounded-[14px] border border-[var(--linea)] bg-white p-3 text-[15px] outline-none" />
            </Group>
          </div>
        </div>
        <div className="border-t border-[var(--linea)] px-5 pb-6 pt-3">
          <Button onClick={() => void save()} disabled={busy}>{busy ? "Guardando…" : "Guardar"}</Button>
        </div>
      </div>
    </div>
  );
}
