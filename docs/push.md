# Recordatorios Web Push de Savia

## Qué hay
- **Cliente**: `src/components/push-reminders.tsx` (tarjeta «Activar recordatorios» en Más + invitación suave en Hoy), `src/lib/push-client.ts`, service worker `public/savia-sw.js` (`push` + `notificationclick` → abre `/app/hoy`).
- **iPhone**: Web Push solo funciona con Savia añadida a la pantalla de inicio (iOS 16.4+). En Safari sin instalar se muestran los pasos en vez del interruptor.
- **Servidor**: `src/lib/push-server.ts`; tabla `push_subscriptions` (migración `0012_push_subscriptions.sql`); rutas:
  - `GET /api/push/key` – clave pública VAPID.
  - `POST /api/push/subscribe` · `/api/push/unsubscribe` · `/api/push/hour` – requieren `deviceId` + `token` del dispositivo (identidad beta, igual que el resto de la app; `user_id` = `savia_testers.device_id`).
  - `POST /api/push/test` – UNA notificación a la suscripción propia de quien la pide (funciona aunque el envío general esté apagado). Máx. 1 por minuto.
  - `GET /api/cron/push` – `Authorization: Bearer $CRON_SECRET`. Sin el secreto → 401.
- **Textos**: `src/lib/companion-messages.ts` (los mismos que la nota de Hoy).

## Interruptor de envío (APAGADO por defecto)
`PUSH_SENDING_ENABLED` debe ser exactamente `true` para que el cron envíe. Si no está (hoy no está), el cron responde en modo **dry run**: lista lo que *enviaría* (`wouldSend`) y no envía nada ni marca `last_sent_on`.

Para encender (cuando Andrés apruebe los textos):
```
cd /workspace/savia/vercel-link
printf 'true' | npx vercel@latest env add PUSH_SENDING_ENABLED production
npx vercel@latest --prod   # o un push a main; las env vars se leen en tiempo de ejecución
```

## Vercel Hobby: el cron solo puede correr 1 vez al día
Docs (https://vercel.com/docs/cron-jobs/usage-and-pricing, revisado 26 sept 2026): en Hobby los cron jobs corren **como máximo una vez al día** (una expresión horaria falla el deploy) y con precisión de **±59 min** (un cron a las 14:00 UTC puede dispararse entre 14:00 y 14:59).

Por eso `vercel.json` tiene un solo cron diario:
```
/api/cron/push?mode=daily   0 14 * * *   (≈ 10:00–10:59 Caracas, 09:00 Bogotá/Lima, 08:00 México)
```
- `mode=daily`: envía a todas las suscripciones que aún no recibieron mensaje hoy (en su zona), sin importar la hora preferida, respetando horas de silencio (antes de 07:00 y desde 22:00 locales). El saludo se calcula con la hora real local al enviar, así que siempre es correcto.
- La **hora preferida** elegida en la app solo se respeta con un disparo por hora: `mode=hourly` (por defecto) envía a quien ya llegó a su hora preferida y no recibió mensaje hoy.

**Alternativa gratuita (no configurada):** un planificador externo gratuito (p. ej. cron-job.org, o un workflow `schedule` de GitHub Actions) que llame cada hora a
`GET https://savia-casa.vercel.app/api/cron/push?mode=hourly` con el header `Authorization: Bearer <CRON_SECRET>`. Con eso se respeta la hora elegida; el cron diario de Vercel puede quedarse como respaldo (no duplica: `last_sent_on` evita dos mensajes el mismo día).

Nota: Nitro genera `.vercel/output/config.json`, así que `vite.config.ts` copia los `crons` de `vercel.json` allí.

## Privacidad en la pantalla bloqueada
Las líneas de push son discretas: nunca mencionan relaciones, dolor ni anticoncepción de emergencia. Los días fértiles se dicen como estimación («el calendario no es anticonceptivo»).
