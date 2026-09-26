import { createFileRoute } from "@tanstack/react-router";

/**
 * Daily companion push. Protected by `Authorization: Bearer $CRON_SECRET`
 * (Vercel Cron sends it automatically). Dry run unless PUSH_SENDING_ENABLED=true.
 *   ?mode=daily  — Vercel Hobby (one run/day): everyone not yet messaged today.
 *   ?mode=hourly — (default) for an external hourly scheduler: preferred hour reached.
 */
export const Route = createFileRoute("/api/cron/push")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { cronAuthorized, json, runCron } = await import("@/lib/push-server");
        if (!(await cronAuthorized(request))) return json({ ok: false, error: "unauthorized" }, 401);
        const mode = new URL(request.url).searchParams.get("mode") === "daily" ? "daily" : "hourly";
        try {
          return json(await runCron(mode));
        } catch (err) {
          console.error("[push-cron] failed:", (err as Error)?.message || err);
          return json({ ok: false, error: "cron-failed" }, 500);
        }
      },
    },
  },
});
