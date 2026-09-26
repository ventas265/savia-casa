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
      <Link to="/app/recuperar" className="mt-3 block text-center text-xs font-semibold opacity-80">
        {t.recoverHint}
      </Link>
    </section>
  );
}
