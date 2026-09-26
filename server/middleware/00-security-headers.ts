/**
 * Global security headers (CSP, frame-ancestors, Referrer-Policy,
 * Permissions-Policy, nosniff). Nitro auto-registers server/middleware/* in
 * filename order; the "00-" prefix makes this wrap every other middleware
 * (incl. grok-pwa's early manifest/install responses) and all SSR/API output.
 */
import { SECURITY_HEADERS } from "../../src/lib/security-headers";

interface SecEvent {
  res?: { headers?: Headers };
}

function apply(headers: Headers) {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) headers.set(k, v);
}

export default async function securityHeadersMiddleware(
  event: SecEvent,
  next: () => unknown | Promise<unknown>,
): Promise<unknown> {
  try {
    if (event.res?.headers) apply(event.res.headers);
  } catch {
    /* prepared headers unavailable — handled on the Response below */
  }
  const result = await next();
  if (result instanceof Response) {
    try {
      apply(result.headers);
      return result;
    } catch {
      // Immutable headers (e.g. a fetched Response): re-wrap.
      const headers = new Headers(result.headers);
      apply(headers);
      return new Response(result.body, { status: result.status, statusText: result.statusText, headers });
    }
  }
  return result;
}
