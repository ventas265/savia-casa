import { createFileRoute } from "@tanstack/react-router";

/** Public VAPID key (safe to expose) + whether server sending is switched on. */
export const Route = createFileRoute("/api/push/key")({
  server: {
    handlers: {
      GET: async () => {
        const { json, sendingEnabled, vapidPublicKey } = await import("@/lib/push-server");
        const key = vapidPublicKey();
        return json({ ok: Boolean(key), publicKey: key, sending: sendingEnabled() });
      },
    },
  },
});
