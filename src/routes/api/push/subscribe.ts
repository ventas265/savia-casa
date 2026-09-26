import { createFileRoute } from "@tanstack/react-router";

/** Save / refresh this browser's push subscription for the calling device. */
export const Route = createFileRoute("/api/push/subscribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { cleanEndpoint, cleanHour, deviceFrom, json, readJson } = await import("@/lib/push-server");
        const { safeTimeZone, companionName } = await import("@/lib/companion-messages");
        const { getSql } = await import("@/lib/db");
        const body = await readJson(request);
        const userId = await deviceFrom(body);
        if (!userId) return json({ ok: false, error: "auth" }, 401);
        const sub = (body?.subscription ?? {}) as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
        const endpoint = cleanEndpoint(sub.endpoint);
        const p256dh = typeof sub.keys?.p256dh === "string" ? sub.keys.p256dh.slice(0, 200) : "";
        const auth = typeof sub.keys?.auth === "string" ? sub.keys.auth.slice(0, 100) : "";
        if (!endpoint || p256dh.length < 20 || auth.length < 8) return json({ ok: false, error: "subscription" }, 400);
        const hour = cleanHour(body?.hour);
        const tz = safeTimeZone(typeof body?.timezone === "string" ? body.timezone : "");
        const locale = body?.locale === "en" ? "en" : "es";
        const name = companionName(typeof body?.name === "string" ? body.name : "");
        const sql = await getSql();
        await sql`
          insert into push_subscriptions (endpoint, p256dh, auth, user_id, display_name, timezone, preferred_hour, locale, enabled)
          values (${endpoint}, ${p256dh}, ${auth}, ${userId}, ${name}, ${tz}, ${hour}, ${locale}, true)
          on conflict (endpoint) do update set
            p256dh = excluded.p256dh,
            auth = excluded.auth,
            user_id = excluded.user_id,
            display_name = excluded.display_name,
            timezone = excluded.timezone,
            preferred_hour = excluded.preferred_hour,
            locale = excluded.locale,
            enabled = true,
            fail_count = 0,
            updated_at = now()
        `;
        return json({ ok: true, hour, timezone: tz });
      },
    },
  },
});
