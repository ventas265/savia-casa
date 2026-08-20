import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/privacidad")({ component: Privacidad });

function Privacidad() {
  const { lang } = useI18n();
  const es = lang !== "en";
  return (
    <div className="min-h-dvh bg-bg">
      <SiteHeader />
      <main className="mx-auto max-w-lg space-y-4 px-4 py-10 text-sm leading-relaxed">
        <h1 className="text-2xl font-extrabold">{es ? "Privacidad" : "Privacy"}</h1>
        <p className="text-muted">{es ? "Actualizado: agosto 2026." : "Updated: August 2026."}</p>
        {es ? (
          <>
            <p>Savia guarda tu ciclo, síntomas y lo que escribes en el chat para mostrártelo a ti. No se vende a Facebook, Google ni anunciantes.</p>
            <p>En la beta, los datos quedan en este teléfono (almacenamiento local). Si más adelante hay cuenta con correo, se guardan en un servidor (Postgres) atados a esa cuenta.</p>
            <p>El chat se envía a un modelo de IA (xAI) con un resumen de tu perfil para responder. No uses el chat para emergencias.</p>
            <p>Los pagos con tarjeta y PayPal los procesa Whop (caja de Savia). Transferencia bancaria, Zinli y USDT son envíos que tú haces; Savia no guarda números de tarjeta.</p>
            <p>Puedes borrar el cuaderno de este teléfono limpiando los datos del sitio. Para borrar una cuenta de servidor, escribe a quien te dio el acceso.</p>
            <p>Savia no es un dispositivo médico ni un diagnóstico.</p>
          </>
        ) : (
          <>
            <p>Savia stores your cycle, symptoms and chat so you can see them. It is not sold to Facebook, Google or advertisers.</p>
            <p>In beta, data stays on this phone. A later signed-in version stores it on a server tied to your account.</p>
            <p>Chat is sent to an AI model with a short profile summary. Do not use chat in an emergency.</p>
            <p>Card/PayPal go through Whop. Zinli and bank transfers are sent by you; Savia does not store card numbers.</p>
            <p>Savia is not a medical device and does not diagnose.</p>
          </>
        )}
        <Link to="/" className="inline-block font-semibold text-primary">
          Savia
        </Link>
      </main>
    </div>
  );
}
