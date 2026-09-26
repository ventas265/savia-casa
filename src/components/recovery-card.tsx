import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

/** One-time recovery code (right after the device registers). */
export function RecoveryCard({ code, onDone }: { code: string; onDone: () => void }) {
  const { t } = useI18n();
  if (!code) return null;
  return (
    <section className="relative mb-4 rounded-[1.5rem] card-hot p-5">
      <p className="text-xs font-bold uppercase tracking-wide opacity-80">{t.keepCode}</p>
      <p className="mt-2 break-all font-display text-2xl font-semibold tracking-[0.06em]">{code}</p>
      <p className="mt-2 text-sm opacity-90">{t.keepCodeBody}</p>
      <button
        type="button"
        className="press mt-4 h-11 w-full rounded-full bg-white text-sm font-semibold text-[#130d12]"
        onClick={() => {
          void navigator.clipboard.writeText(code).then(
            () => toast.success(t.copiedCode),
            () => toast.error(t.errorGeneric),
          );
        }}
      >
        {t.copyCode}
      </button>
      <button
        type="button"
        data-testid="recovery-done"
        onClick={onDone}
        className="press mt-2 h-11 w-full rounded-full bg-white/10 text-sm font-semibold ring-1 ring-white/15"
      >
        {t.keepCodeDone}
      </button>
      <Link to="/app/recuperar" className="mt-2 flex min-h-11 items-center justify-center text-xs font-semibold opacity-80">
        {t.recoverHint}
      </Link>
    </section>
  );
}
