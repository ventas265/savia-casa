import { getRequest } from "@tanstack/react-start/server";

/**
 * Caller IP for rate limiting — server-only (`.server.ts`, imports
 * `@tanstack/react-start/server`). On Vercel `x-real-ip` / `x-forwarded-for`
 * are set by the edge (client-supplied values are overwritten).
 */
export function clientIp(): string {
  try {
    const h = getRequest()?.headers;
    if (!h) return "unknown";
    const real = h.get("x-real-ip")?.trim();
    if (real) return real.slice(0, 64);
    const fwd = h.get("x-forwarded-for")?.split(",")[0]?.trim();
    return (fwd || "unknown").slice(0, 64);
  } catch {
    return "unknown";
  }
}
