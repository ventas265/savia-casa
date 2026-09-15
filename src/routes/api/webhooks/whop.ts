import { createFileRoute } from "@tanstack/react-router";
import { handleWhopEvent, verifyWhopSignature } from "@/lib/whop-webhook";

export const Route = createFileRoute("/api/webhooks/whop")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.WHOP_WEBHOOK_SECRET?.trim() ?? "";
        const raw = await request.text();
        if (!secret || !verifyWhopSignature(raw, request.headers, secret)) {
          return new Response("invalid", { status: 401 });
        }
        let body: Record<string, unknown> = {};
        try {
          body = JSON.parse(raw) as Record<string, unknown>;
        } catch {
          return new Response("bad json", { status: 400 });
        }
        await handleWhopEvent(body);
        return Response.json({ ok: true });
      },
    },
  },
});