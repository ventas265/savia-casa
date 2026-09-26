import { createFileRoute } from "@tanstack/react-router";

/** Forget this browser's subscription (only the caller's own). */
export const Route = createFileRoute("/api/push/unsubscribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { cleanEndpoint, deviceFrom, json, readJson } = await import("@/lib/push-server");
        const { getSql } = await import("@/lib/db");
        const body = await readJson(request);
        const userId = await deviceFrom(body);
        if (!userId) return json({ ok: false, error: "auth" }, 401);
        const endpoint = cleanEndpoint(body?.endpoint);
        const sql = await getSql();
        if (endpoint) await sql`delete from push_subscriptions where endpoint = ${endpoint} and user_id = ${userId}`;
        else await sql`delete from push_subscriptions where user_id = ${userId}`;
        return json({ ok: true });
      },
    },
  },
});
