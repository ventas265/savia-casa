import { createFileRoute } from "@tanstack/react-router";

/** Change the preferred reminder hour (and time zone) of the caller's subscription. */
export const Route = createFileRoute("/api/push/hour")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { cleanEndpoint, cleanHour, deviceFrom, json, readJson } = await import("@/lib/push-server");
        const { safeTimeZone } = await import("@/lib/companion-messages");
        const { getSql } = await import("@/lib/db");
        const body = await readJson(request);
        const userId = await deviceFrom(body);
        if (!userId) return json({ ok: false, error: "auth" }, 401);
        const endpoint = cleanEndpoint(body?.endpoint);
        if (!endpoint) return json({ ok: false, error: "endpoint" }, 400);
        const hour = cleanHour(body?.hour, -1);
        if (hour < 0) return json({ ok: false, error: "hour" }, 400);
        const tz = safeTimeZone(typeof body?.timezone === "string" ? body.timezone : "");
        const sql = await getSql();
        const rows = await sql<{ id: number }>`
          update push_subscriptions set preferred_hour = ${hour}, timezone = ${tz}, updated_at = now()
          where endpoint = ${endpoint} and user_id = ${userId}
          returning id
        `;
        if (!rows.length) return json({ ok: false, error: "not-subscribed" }, 404);
        return json({ ok: true, hour, timezone: tz });
      },
    },
  },
});
