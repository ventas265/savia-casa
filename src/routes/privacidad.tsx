import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { DeleteMyData } from "@/components/delete-my-data";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/privacidad")({ component: Privacidad });

const CONTACT = "ventas@anclagroupmcbo.com";

type Block = { h: string; ps: string[] };

const ES: Block[] = [
  {
    h: "Qué es Savia",
    ps: [
      "Savia es un cuaderno del ciclo y del bienestar para mujeres jóvenes. No es un dispositivo médico, no diagnostica, no receta, no es un anticonceptivo y no promete un embarazo. Las fechas de periodo y de ovulación son estimaciones.",
      "El camino por defecto es el ciclo. Embarazo, posparto, perimenopausia y menopausia solo entran si tú los eliges al armar tu perfil.",
    ],
  },
  {
    h: "Quién la opera",
    ps: [
      "La app no nombra una empresa ni una razón social. Savia la opera la persona detrás de ventas@anclagroupmcbo.com. Ese es el contacto de privacidad porque es el correo público de la cuenta de GitHub ventas265. No hay dirección postal ni delegado de protección de datos en esta app.",
    ],
  },
  {
    h: "En este teléfono",
    ps: [
      "El navegador guarda una copia tuya para que el cuaderno abra sin esperar al servidor. En localStorage: savia.device (un id de este teléfono), savia.token (la credencial secreta), savia.beta.v1 (perfil, hasta unos 180 días anotados, inicios de periodo, cómo te sentiste y la nota del día), savia-lang (idioma), savia.push.v1 (si activaste recordatorios, la hora y el endpoint), y marcas del día (si ya preguntamos síntomas, si cerraste el aviso de periodo, si ya mostramos una notificación, y la nota de Savia de ese día si la IA respondió).",
      "En sessionStorage, solo mientras la pestaña sigue abierta: el día que elegiste en el calendario, un aviso de que los recordatorios locales ya se armaron, y a veces el código de recuperación un instante antes de mostrártelo. El chat de Savia IA vive en la memoria de esa pantalla: al salir o recargar, no lo guardamos en el teléfono ni en nuestra base.",
      "Si activas recordatorios locales, el navegador puede guardar el plan del aviso en la caché llamada savia-remind. No hay otra base en el teléfono (no usamos IndexedDB).",
    ],
  },
  {
    h: "En el servidor",
    ps: [
      "La app corre en Vercel. Los datos del servidor están en Postgres: Neon cuando hay DATABASE_URL, o una Postgres embebida en ese servidor (PGLite) si no la hay. No prometemos cuál de las dos está activa en cada despliegue: lo decide esa variable.",
      "Atado a la credencial de este teléfono: en savia_testers el id, el nombre, la etapa, el país, la credencial (para comprobar que eres tú), un hash del código de recuperación (el código en claro no se guarda) y las fechas de alta y de última visita. En savia_profiles el perfil del ciclo: nombre, etapa, año de nacimiento si lo diste, largo del ciclo y del periodo, último inicio, fecha probable de parto si estás en embarazo, intención, idioma, plan y cuántas preguntas llevas. En period_starts los inicios de periodo. En daily_logs cada día: flujo, ánimo, energía, sueño, notas, síntomas, moco, y si marcaste sexo y de qué tipo.",
      "Si activas recordatorios push, guardamos la suscripción del navegador (endpoint y claves), tu nombre para el saludo, zona horaria, hora elegida e idioma. El servidor arma el texto con tu perfil y tus días. El envío automático solo corre si PUSH_SENDING_ENABLED es exactamente true. La prueba de notificación solo va a tu suscripción.",
      "Para frenar abusos hay contadores en savia_rate_limits. La clave es un hash, no tu IP en claro ni tu id en claro. Unos contadores son de tu dispositivo (chat y nota de la IA). Otros son de la IP o globales (registro, recuperación, lista de espera, pin de admin). De vez en cuando el código intenta borrar ventanas de más de 2 días. No es una garantía de que desaparezcan a las 48 horas.",
      "Hay tablas viejas (profiles, services, quotes, waitlist) de un esquema anterior. La app de hoy no escribe ahí el ciclo. Si quedara una fila con tu mismo id, el borrado también la quita.",
    ],
  },
  {
    h: "Correos que no van con el teléfono",
    ps: [
      "La lista de espera guarda el correo y el plan que escribiste. No está atada a la credencial del teléfono.",
      "Si avisas un pago manual (Zinli u otro) guardamos el correo, el plan, el monto y una nota de hasta 300 caracteres. No guardamos números de tarjeta. Tarjeta y PayPal los cobra Whop en su caja; si el pago confirma, un webhook guarda el correo, el plan, el monto y una nota del tipo de evento, y si ese correo coincide con una cuenta de inicio de sesión, marca el plan Serena. No controlamos cuánto tiempo Whop conserva el pago.",
      "Esos avisos de pago y la lista de espera no se borran con el botón de este teléfono, porque no sabemos que son tuyos solo con la credencial. Si quieres que los quitemos, escribe al contacto.",
      "Si inicias sesión con correo o con Grok, Better Auth guarda usuario, sesión (puede incluir IP y navegador) y la cuenta. En la beta el cuaderno no depende de esa sesión. El botón cierra la sesión en este navegador, pero no borra esa cuenta: no está atada a la credencial del teléfono.",
      "Una lista en el servidor (SERENA_COMP_EMAILS) puede marcar Serena si el correo de la sesión coincide. No es una tabla de la base. Quién es admin está en SAVIA_ADMIN_EMAILS, también solo en la configuración, no en la página.",
    ],
  },
  {
    h: "Inteligencia artificial",
    ps: [
      "Cuando preguntas o cuando pedimos la nota del día, el servidor llama a la API de xAI (modelo grok-4.5, https://api.x.ai). En el chat va tu pregunta, hasta 8 mensajes anteriores de esa pantalla, y un resumen: nombre, edad aproximada si hay año de nacimiento, etapa, intención, ciclo, último periodo, fase, semana de embarazo si aplica, el día de hoy (flujo, moco, síntomas, ánimo, energía, sueño), cómo te sentiste, tu nota, el título de la carta de la mañana, la canción del día que eligió la app y los días que faltan para el periodo. La nota del día manda un saludo, tu nombre si existe, el momento del día y un texto corto de hechos más un borrador.",
      "En nuestros logs no guardamos la conversación: solo si la llamada falló, el código de estado y, si xAI devuelve un error, un recorte de ese error. No guardamos el chat en Postgres. No sabemos cuánto tiempo xAI conserva lo que recibe. Eso no lo controlamos y no inventamos un plazo.",
    ],
  },
  {
    h: "Quién puede verlo",
    ps: [
      "Tú, con la credencial de este teléfono o con el código de recuperación, que devuelve esa credencial.",
      "Quien tenga el PIN de admin (SAVIA_ADMIN_PIN) puede ver una lista de testers: nombre, etapa, país y fechas. Esa lista no incluye el cuaderno, la credencial ni el código. Si el PIN no está configurado, nadie entra.",
      "Quien inicie sesión y esté en SAVIA_ADMIN_EMAILS puede cambiar los datos de pago públicos (Zinli y el resto). Eso no abre el cuaderno de las demás.",
      "El cron de recordatorios lee el perfil y los días de quien tiene push activo, para escribirle a esa persona. No hay en el código una pantalla para exportar todos los cuadernos.",
    ],
  },
  {
    h: "Cuánto tiempo",
    ps: [
      "No hay una fecha automática para borrar el perfil, los días, la suscripción push ni la credencial. Siguen hasta que usas el botón de borrar, o hasta que corriges un día suelto.",
      "En el teléfono el cuaderno local se recorta a unos 180 días. Los contadores de abuso se intentan limpiar después de 2 días, sin garantía. El chat de la pantalla se pierde al salir. Lo que xAI, Whop o el navegador (notificaciones, service worker) guarden por su cuenta no lo decidimos nosotros.",
    ],
  },
  {
    h: "Qué no hacemos",
    ps: [
      "No vendemos tus datos a Facebook, Google ni a anunciantes. No hay librería de analítica en la app ni cookies de seguimiento nuestras. No ponemos un aviso de cookies porque no usamos cookies de rastreo.",
      "Las cookies que sí pueden existir son las de sesión de Better Auth, solo si inicias sesión (nombres que empiezan por __Host-grok-auth). Sirven para saber que eres tú, no para publicidad.",
      "Las letras se piden a Google Fonts (fonts.googleapis.com y fonts.gstatic.com). En la versión publicada la página también carga un script de la plataforma, https://grok.com/grok-app-builder/extensions.js. No controlamos si Google o ese script guardan algo. Savia no les manda tu cuaderno.",
      "No guardamos el número de tu tarjeta. No usamos tu cuaderno para entrenar un modelo propio: no hay ese paso en el código.",
    ],
  },
  {
    h: "Borrar todo",
    ps: [
      "El botón de abajo (también en Tú) pide que escribas BORRAR. Si la credencial de este teléfono es válida, borra solo tus filas: días, inicios de periodo, perfil, suscripción push, contadores de abuso de este dispositivo, filas viejas con el mismo id, y la credencial. Luego limpia el almacenamiento local y las cachés de Savia en este navegador, cierra la sesión si había una, y vuelves al inicio.",
      "Si no hay credencial, o no coincide, no se borra nada. No crea una credencial nueva para poder borrar. No borra a otras personas, la configuración de pagos, la lista de espera, los avisos de pago por correo, ni los contadores por IP (pueden ser de más gente en la misma red).",
      "Puedes repetirlo: la segunda vez el servidor ya no te reconoce, y no toca lo de nadie más. Si alguna tabla tuya estaba vacía, el borrado sigue y no falla por eso.",
    ],
  },
];

const EN: Block[] = [
  {
    h: "What Savia is",
    ps: [
      "Savia is a cycle and wellness notebook for young women. It is not a medical device, it does not diagnose or prescribe, it is not contraception, and it does not promise a pregnancy. Period and ovulation dates are estimates.",
      "The default path is the cycle. Pregnancy, postpartum, perimenopause and menopause are included only if you choose them.",
    ],
  },
  {
    h: "Who operates it",
    ps: [
      "The app does not name a company. Savia is operated by the person behind ventas@anclagroupmcbo.com. That is the privacy contact because it is the public email of the GitHub account ventas265. There is no postal address and no data-protection officer in this app.",
    ],
  },
  {
    h: "On this phone",
    ps: [
      "The browser keeps a copy so the notebook opens without waiting for the server. In localStorage: savia.device (an id for this phone), savia.token (the secret credential), savia.beta.v1 (profile, up to about 180 logged days, period starts, check-ins and the day’s note), savia-lang (language), savia.push.v1 (reminders on/off, hour and endpoint), and per-day flags (symptom question, period prompt, notification already shown, and that day’s AI note if one came back).",
      "sessionStorage, only while the tab is open: the calendar day you picked, a flag that local reminders were armed, and sometimes the recovery code for a moment before it is shown. Savia AI chat lives in that screen’s memory. Leaving or reloading does not save it on the phone or in our database.",
      "If you turn on local reminders, the browser may store the plan in a cache named savia-remind. We do not use IndexedDB.",
    ],
  },
  {
    h: "On the server",
    ps: [
      "The app runs on Vercel. Server data is in Postgres: Neon when DATABASE_URL is set, or an embedded Postgres (PGLite) on that server when it is not. We do not promise which one a given deploy uses.",
      "Tied to this phone’s credential: savia_testers holds the id, name, stage, country, the credential (so we can check it is you), a hash of the recovery code (the code itself is not stored) and created/last-seen times. savia_profiles holds the cycle profile: name, stage, birth year if you gave it, cycle and period length, last start, due date if you are in pregnancy, intention, locale, plan and ask count. period_starts holds period starts. daily_logs holds each day: flow, mood, energy, sleep, notes, symptoms, mucus, and whether you marked sex and what kind.",
      "If you enable push, we store the browser subscription (endpoint and keys), the name used in the greeting, time zone, chosen hour and locale. The server builds the text from your profile and days. Automatic sending runs only when PUSH_SENDING_ENABLED is exactly true. A test notification goes only to your subscription.",
      "Abuse counters live in savia_rate_limits. The key is a hash, not your raw IP or raw id. Some counters are per device (AI chat and the daily note). Others are per IP or global (registration, recovery, waitlist, admin PIN). The code sometimes tries to delete windows older than 2 days. That is not a promise they are gone after 48 hours.",
      "Older tables (profiles, services, quotes, waitlist) come from an earlier schema. Today’s app does not write the cycle there. If a row with your same id existed, delete removes it too.",
    ],
  },
  {
    h: "Emails not tied to the phone",
    ps: [
      "The waitlist stores the email and plan you typed. It is not tied to the phone credential.",
      "If you report a manual payment (Zinli or otherwise) we store the email, plan, amount and a note of up to 300 characters. We do not store card numbers. Card and PayPal are charged by Whop. When a payment confirms, a webhook stores the email, plan, amount and a short event note, and if that email matches a sign-in account it marks the Serena plan. We do not control how long Whop keeps the payment.",
      "Those payment reports and the waitlist are not removed by this phone’s button, because the credential does not prove they are yours. Write to the contact if you want them removed.",
      "If you sign in with email or Grok, Better Auth stores the user, the session (it can include IP and browser) and the account. In the beta the notebook does not depend on that session. The button signs this browser out, but it does not delete that account: it is not tied to the phone credential.",
      "A server setting (SERENA_COMP_EMAILS) can mark Serena when the session email matches. It is not a database table. Who is an admin lives in SAVIA_ADMIN_EMAILS, also only in configuration, not on this page.",
    ],
  },
  {
    h: "Artificial intelligence",
    ps: [
      "When you ask, or when we request the daily note, the server calls xAI (model grok-4.5, https://api.x.ai). Chat sends your question, up to 8 earlier messages from that screen, and a summary: name, approximate age if there is a birth year, stage, intention, cycle, last period, phase, pregnancy week if any, today (flow, mucus, symptoms, mood, energy, sleep), how you felt, your note, the morning letter title, the song the app picked and days until the period. The daily note sends a greeting, your name if any, the time of day, a short fact sheet and a draft.",
      "Our logs do not store the conversation: only whether the call failed, the status code and, if xAI returns an error, a short slice of that error. We do not store the chat in Postgres. We do not know how long xAI keeps what it receives. We do not control that and we do not invent a number.",
    ],
  },
  {
    h: "Who can see it",
    ps: [
      "You, with this phone’s credential or with the recovery code, which returns that credential.",
      "Whoever has the admin PIN (SAVIA_ADMIN_PIN) can see a tester list: name, stage, country and dates. That list does not include the notebook, the credential or the code. If the PIN is not set, nobody gets in.",
      "A signed-in user listed in SAVIA_ADMIN_EMAILS can change the public payment destinations (Zinli and the rest). That does not open other people’s notebooks.",
      "The reminder cron reads the profile and days of people with push on, to write to that person. There is no screen in the code that exports every notebook.",
    ],
  },
  {
    h: "How long",
    ps: [
      "There is no automatic date that deletes the profile, the days, the push subscription or the credential. They stay until you use the delete button, or until you correct a single day.",
      "On the phone the local notebook is trimmed to about 180 days. Abuse counters are sometimes cleaned after 2 days, without a guarantee. The on-screen chat is gone when you leave. What xAI, Whop or the browser keep on their own is not our decision.",
    ],
  },
  {
    h: "What we do not do",
    ps: [
      "We do not sell your data to Facebook, Google or advertisers. There is no analytics library in the app and no tracking cookies of ours. There is no cookie banner because we do not use tracking cookies.",
      "Cookies that can exist are Better Auth session cookies, only if you sign in (names starting with __Host-grok-auth). They say who you are, not an ad profile.",
      "Fonts are loaded from Google Fonts. The published page also loads a platform script, https://grok.com/grok-app-builder/extensions.js. We do not control whether Google or that script stores anything. Savia does not send them your notebook.",
      "We do not store your card number. We do not use your notebook to train a model of our own: there is no such step in the code.",
    ],
  },
  {
    h: "Delete everything",
    ps: [
      "The button below (also under You) asks you to type the confirm word. If this phone’s credential is valid, it deletes only your rows: days, period starts, profile, push subscription, this device’s abuse counters, old rows with the same id, and the credential. Then it clears Savia local storage and Savia caches in this browser, signs out if there was a session, and returns you to the start.",
      "If there is no credential, or it does not match, nothing is deleted. It does not create a new credential in order to delete. It does not delete other people, payment settings, the waitlist, payment reports stored by email, or IP counters (those can belong to other people on the same network).",
      "You can try again: the second time the server no longer recognizes you, and it does not touch anyone else. If one of your tables was empty, the delete still finishes.",
    ],
  },
];

function Privacidad() {
  const { lang } = useI18n();
  const es = lang !== "en";
  const blocks = es ? ES : EN;
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-lg space-y-8 px-4 py-10 text-sm leading-relaxed" data-testid="privacidad">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-[-0.03em]">{es ? "Privacidad" : "Privacy"}</h1>
          <p className="mt-2 text-muted">{es ? "Actualizado: 30 de septiembre de 2026." : "Updated: 30 September 2026."}</p>
          <p className="mt-3 text-soft">
            {es
              ? "Esto describe lo que el código hace hoy. Si algo no está en el código, no lo prometemos aquí."
              : "This describes what the code does today. If it is not in the code, it is not promised here."}
          </p>
        </div>
        {blocks.map((b) => (
          <section key={b.h}>
            <h2 className="font-display text-lg font-semibold tracking-[-0.02em]">{b.h}</h2>
            {b.ps.map((p) => (
              <p key={p.slice(0, 40)} className="mt-2 text-soft">
                {p}
              </p>
            ))}
          </section>
        ))}
        <p>
          <a className="font-semibold text-rose-dust" href={`mailto:${CONTACT}`}>
            {CONTACT}
          </a>
        </p>
        <DeleteMyData />
        <p className="flex gap-4 font-semibold">
          <Link to="/" className="text-primary">
            Savia
          </Link>
          <Link to="/terminos" className="text-primary">
            {es ? "Términos" : "Terms"}
          </Link>
        </p>
      </main>
    </div>
  );
}
