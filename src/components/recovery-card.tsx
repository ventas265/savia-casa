import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { takeRecovery } from "@/lib/device";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

export function RecoveryCard() {
  const { t } = useI18n();
  const [code, setCode] = useState("");
  useEffect(() => {
    setCode(takeRecovery());
  }, []);
  if (!code) return null;
  return (
    <section className="relative mb-4 rounded-[1.5rem] bg-plum p-5 text-primary-fg">
      <p className="text-xs font-bold uppercase tracking-wide opacity-80">{t.keepCode}</p>
      <p className="mt-2 font-display text-3xl font-semibold tracking-[0.2em]">{code}</p>
      <p className="mt-2 text-sm opacity-90">{t.keepCodeBody}</p>
      <button
        type="button"
        className="press mt-4 h-11 w-full rounded-full bg-surface text-sm font-semibold text-primary"
        onClick={() => {
          void navigator.clipboard.writeText(code).then(
            () => toast.success(t.copiedCode),
            () => toast.error(t.errorGeneric),
          );
        }}
      >
        {t.copyCode}
      </button>
      <Link to="/app/recuperar" className="mt-3 block text-center text-xs font-semibold opacity-80">
        {t.recoverHint}
      </Link>
    </section>
  );
}
