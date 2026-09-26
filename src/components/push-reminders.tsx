import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { BellRing, Share, SquarePlus, X } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { haptic } from "@/lib/haptic";
import { cn } from "@/lib/utils";
import {
  disablePush,
  enablePush,
  formatHour,
  PUSH_HOURS,
  pushSupport,
  readPushState,
  sendPushTest,
  setPushHour,
  type PushResult,
  type PushState,
  type PushSupport,
} from "@/lib/push-client";

const COPY = {
  es: {
    kicker: "Recordatorios",
    title: "Activar recordatorios",
    hint: "Una vez al día, Savia te escribe como una amiga: cómo va tu día y un dato corto de tu ciclo.",
    hour: "Hora",
    test: "Enviar prueba",
    testSent: "Listo, revisa tus notificaciones.",
    on: "Recordatorios activados.",
    off: "Recordatorios desactivados.",
    denied: "Las notificaciones están bloqueadas. Actívalas en los ajustes del navegador para Savia.",
    profile: "Completa tu perfil primero para activar los recordatorios.",
    server: "No pudimos activarlos ahora. Intenta de nuevo en un rato.",
    rate: "Espera un minuto antes de otra prueba.",
    unsupported: "Este navegador no permite notificaciones. Prueba desde Chrome, o añade Savia a tu pantalla de inicio.",
    iosTitle: "En iPhone, primero añade Savia a tu inicio",
    iosIntro: "Apple solo permite recordatorios en apps web instaladas (iOS 16.4 o más nuevo).",
    iosSteps: [
      "Abre savia-casa.vercel.app en Safari.",
      "Toca Compartir (el cuadrito con la flecha hacia arriba).",
      "Elige «Añadir a pantalla de inicio» y toca «Añadir».",
      "Abre Savia desde el ícono nuevo y vuelve aquí para activar los recordatorios.",
    ],
    iosOld: "Tu iPhone necesita iOS 16.4 o más nuevo para recibir recordatorios de Savia.",
    soft: "¿Te escribo cada día a la hora que elijas?",
    softCta: "Activar",
  },
  en: {
    kicker: "Reminders",
    title: "Turn on reminders",
    hint: "Once a day, Savia writes to you like a friend: how your day is going and a short cycle note.",
    hour: "Time",
    test: "Send a test",
    testSent: "Done, check your notifications.",
    on: "Reminders on.",
    off: "Reminders off.",
    denied: "Notifications are blocked. Allow them for Savia in your browser settings.",
    profile: "Finish your profile first to turn on reminders.",
    server: "We couldn't turn them on right now. Try again in a bit.",
    rate: "Wait a minute before another test.",
    unsupported: "This browser doesn't allow notifications. Try Chrome, or add Savia to your home screen.",
    iosTitle: "On iPhone, add Savia to your home screen first",
    iosIntro: "Apple only allows reminders for installed web apps (iOS 16.4 or newer).",
    iosSteps: [
      "Open savia-casa.vercel.app in Safari.",
      "Tap Share (the square with the up arrow).",
      "Choose “Add to Home Screen” and tap “Add”.",
      "Open Savia from the new icon and come back here to turn on reminders.",
    ],
    iosOld: "Your iPhone needs iOS 16.4 or newer to get Savia reminders.",
    soft: "Want me to write to you every day at a time you choose?",
    softCta: "Turn on",
  },
};

function errorText(r: PushResult, c: (typeof COPY)["es"]) {
  if (r.error === "denied") return c.denied;
  if (r.error === "profile") return c.profile;
  if (r.error === "rate") return c.rate;
  if (r.error === "unsupported") return c.unsupported;
  return c.server;
}

export function IosPushGuide({ old = false }: { old?: boolean }) {
  const { lang } = useI18n();
  const c = COPY[lang];
  return (
    <div data-testid="ios-push-guide" className="mt-3 rounded-[1.25rem] bg-bg px-4 py-4">
      <p className="text-sm font-semibold text-fg">{c.iosTitle}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted">{old ? c.iosOld : c.iosIntro}</p>
      {!old ? (
        <ol className="mt-3 space-y-2.5">
          {c.iosSteps.map((s, i) => (
            <li key={s} className="flex items-start gap-3 text-[13px] leading-snug text-fg">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-grad text-[12px] font-semibold text-white">
                {i + 1}
              </span>
              <span className="pt-0.5">
                {s}
                {i === 1 ? <Share className="ml-1 inline size-4 align-[-3px] text-[#ffb0cc]" strokeWidth={1.8} /> : null}
                {i === 2 ? <SquarePlus className="ml-1 inline size-4 align-[-3px] text-[#ffb0cc]" strokeWidth={1.8} /> : null}
              </span>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

/** Ajustes / Más: «Activar recordatorios» toggle + hour picker + test, or the iPhone steps. */
export function PushReminders() {
  const { lang } = useI18n();
  const c = COPY[lang];
  const [support, setSupport] = useState<PushSupport | null>(null);
  const [state, setState] = useState<PushState>({ enabled: false, hour: 9, endpoint: null });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSupport(pushSupport());
    const s = readPushState();
    // Permission revoked in browser settings → show as off.
    if (s.enabled && typeof Notification !== "undefined" && Notification.permission !== "granted") s.enabled = false;
    setState(s);
  }, []);

  async function toggle() {
    if (busy) return;
    haptic(12);
    setBusy(true);
    try {
      if (state.enabled) {
        await disablePush();
        setState((s) => ({ ...s, enabled: false }));
        toast.success(c.off);
      } else {
        const r = await enablePush(state.hour);
        if (r.ok) {
          setState(readPushState());
          toast.success(c.on);
        } else toast.error(errorText(r, c));
      }
    } finally {
      setBusy(false);
    }
  }

  async function changeHour(h: number) {
    setState((s) => ({ ...s, hour: h }));
    const r = await setPushHour(h);
    if (!r.ok) toast.error(errorText(r, c));
  }

  async function test() {
    if (busy) return;
    setBusy(true);
    try {
      const r = await sendPushTest();
      if (r.ok) toast.success(c.testSent);
      else toast.error(errorText(r, c));
    } finally {
      setBusy(false);
    }
  }

  const ios = support === "ios-install" || support === "ios-old";

  return (
    <section id="recordatorios" data-testid="push-reminders" className="mt-4 scroll-mt-6 rounded-[1.6rem] bg-surface p-5 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{c.kicker}</p>
      {ios ? (
        <IosPushGuide old={support === "ios-old"} />
      ) : (
        <>
          <div className="mt-3 flex items-start justify-between gap-4 rounded-[1.25rem] bg-bg px-4 py-3.5">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <BellRing className="size-4 text-[#ffb0cc]" strokeWidth={1.8} />
                {c.title}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{c.hint}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={state.enabled}
              aria-label={c.title}
              data-testid="push-toggle"
              disabled={busy || support === "unsupported"}
              onClick={() => void toggle()}
              className={cn(
                "relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50",
                state.enabled ? "bg-grad" : "bg-white/15",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 size-6 rounded-full bg-white shadow transition-[left]",
                  state.enabled ? "left-[1.4rem]" : "left-0.5",
                )}
              />
            </button>
          </div>
          {support === "unsupported" ? <p className="mt-2 text-xs leading-relaxed text-muted">{c.unsupported}</p> : null}
          <label className="mt-2 flex items-center justify-between gap-3 rounded-[1.25rem] bg-bg px-4 py-3">
            <span className="text-sm font-semibold">{c.hour}</span>
            <select
              data-testid="push-hour"
              value={state.hour}
              onChange={(e) => void changeHour(Number(e.target.value))}
              className="h-10 rounded-full bg-white/[0.08] px-4 text-sm font-semibold text-fg ring-1 ring-white/10 [color-scheme:dark]"
            >
              {PUSH_HOURS.map((h) => (
                <option key={h} value={h}>
                  {formatHour(h)}
                </option>
              ))}
            </select>
          </label>
          {state.enabled ? (
            <button
              type="button"
              data-testid="push-test"
              disabled={busy}
              onClick={() => void test()}
              className="press mt-2 flex min-h-12 w-full items-center justify-center rounded-full bg-white/[0.06] text-sm font-semibold text-fg ring-1 ring-white/10"
            >
              {c.test}
            </button>
          ) : null}
        </>
      )}
    </section>
  );
}

const SOFT_KEY = "savia.push.soft.dismissed";

/** Hoy: a small, dismissible invitation (only where push can work, only while off). */
export function PushSoftPrompt() {
  const { lang } = useI18n();
  const c = COPY[lang];
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem(SOFT_KEY)) return;
    } catch {
      return;
    }
    const s = pushSupport();
    if ((s === "ok" || s === "ios-install") && !readPushState().enabled) setShow(true);
  }, []);
  if (!show) return null;
  return (
    <div data-testid="push-soft" className="glass mt-2 flex items-center gap-3 rounded-[18px] px-4 py-3">
      <BellRing className="size-5 shrink-0 text-[#ffb0cc]" strokeWidth={1.6} />
      <p className="min-w-0 flex-1 text-[13px] leading-snug text-fg">{c.soft}</p>
      <Link
        to="/app/mas"
        hash="recordatorios"
        className="press shrink-0 rounded-full bg-grad px-3.5 py-2 text-[12.5px] font-semibold text-white"
      >
        {c.softCta}
      </Link>
      <button
        type="button"
        aria-label="Cerrar"
        onClick={() => {
          try {
            localStorage.setItem(SOFT_KEY, "1");
          } catch {
            /* ignore */
          }
          setShow(false);
        }}
        className="press grid size-8 shrink-0 place-items-center rounded-full text-muted"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
