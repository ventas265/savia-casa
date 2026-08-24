import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/terminos")({ component: Terminos });

function Terminos() {
  const { lang } = useI18n();
  const es = lang !== "en";
  return (
    <div className="min-h-dvh bg-bg">
      <SiteHeader />
      <main className="mx-auto max-w-lg space-y-4 px-4 py-10 text-sm leading-relaxed">
        <h1 className="text-2xl font-extrabold">{es ? "Términos" : "Terms"}</h1>
        <p className="text-muted">{es ? "Actualizado: agosto 2026." : "Updated: August 2026."}</p>
        {es ? (
          <>
            <p>Savia es una app de acompañamiento del ciclo, embarazo, perimenopausia y menopausia. No diagnostica, no receta, no es anticonceptivo.</p>
            <p>Las fechas de regla y ovulación son estimados. Si sangras mucho, te desmayas, hay dolor fuerte de un lado, sangrado en embarazo o ideas de hacerte daño, ve a urgencias (911 en la mayoría de LATAM; Colombia 123, Argentina 107, Chile 131, Perú 106).</p>
            <p>Serena ($4.99/mes o $39/año) desbloquea chat ilimitado, marcar relaciones e informe. En beta el chat está abierto. La caja de tarjeta la opera Whop. Transferencias son envíos manuales.</p>
            <p>El contenido de tés y comida es educativo. En embarazo no tomes hierbas sin tu médico.</p>
            <p>Al usar Savia aceptas estos términos y la privacidad.</p>
          </>
        ) : (
          <>
            <p>Savia accompanies cycles, pregnancy, perimenopause and menopause. It does not diagnose, prescribe, or act as contraception.</p>
            <p>Period and ovulation dates are estimates. Heavy bleeding, fainting, one-sided pain, bleeding in pregnancy, or thoughts of self-harm: emergency care.</p>
            <p>Serena ($4.99/mo or $39/yr) unlocks unlimited chat, sex marks and the report. Card payments go through Whop.</p>
            <p>Tea and food notes are educational. Do not take herbs in pregnancy without your clinician.</p>
          </>
        )}
        <Link to="/privacidad" className="inline-block font-semibold text-primary">
          {es ? "Privacidad" : "Privacy"}
        </Link>
      </main>
    </div>
  );
}
