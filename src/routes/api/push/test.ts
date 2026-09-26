import { createFileRoute } from "@tanstack/react-router";

const MIN_GAP_MS = 60 * 1000;

/**
 * Send ONE test message to the caller's own current subscription. Allowed even
 * with PUSH_SENDING_ENABLED off (it only targets the requester). 1 per minute.
 */
export const Route = createFileRoute("/api/push/test")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { cleanEndpoint, deviceFrom, json, messageFor, readJson, sendOne } = await import("@/lib/push-server");
        const { getSql } = await import("@/lib/db");
        const body = await readJson(request);
        const userId = await deviceFrom(body);
        if (!userId) return json({ ok: false, error: "auth" }, 401);
        const endpoint = cleanEndpoint(body?.endpoint);
        if (!endpoint) return json({ ok: false, error: "endpoint" }, 400);
        const sql = await getSql();
        const row = (
          await sql<{
            id: number;
            endpoint: string;
            p256dh: string;
            auth: string;
            user_id: string;
            display_name: string;
            timezone: string;
            locale: string;
            last_test_at: string | null;
          }>`
            select id, endpoint, p256dh, auth, user_id, display_name, timezone, locale, last_test_at::text as last_test_at
            from push_subscriptions
            where endpoint = ${endpoint} and user_id = ${userId} and enabled = true
            limit 1
          `
        )[0];
        if (!row) return json({ ok: false, error: "not-subscribed" }, 404);
        if (row.last_test_at && Date.now() - new Date(row.last_test_at).getTime() < MIN_GAP_MS) {
          return json({ ok: false, error: "rate-limited", retryAfterSec: 60 }, 429);
        }
        await sql`update push_subscriptions set last_test_at = now() where id = ${row.id}`;
        const built = await messageFor(row);
        const r = await sendOne(row, built.msg, { tag: "savia-test" });
        if (r.gone) await sql`update push_subscriptions set enabled = false, updated_at = now() where id = ${row.id}`;
        return json({ ok: r.ok, error: r.ok ? undefined : r.error, title: built.msg.title, body: built.msg.body }, r.ok ? 200 : 502);
      },
    },
  },
});
