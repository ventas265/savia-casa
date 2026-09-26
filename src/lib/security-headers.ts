/**
 * Security headers for every response served by the app function (SSR pages,
 * server functions, API routes). Applied by server/middleware/00-security-headers.ts.
 *
 * CSP notes:
 * - script-src 'unsafe-inline': TanStack Start streams inline hydration scripts
 *   ($tsr) without nonces; https://grok.com is the platform "Created with Grok"
 *   banner script injected by server/middleware/grok-pwa.ts.
 * - style-src / font-src: Google Fonts (@import in styles.css) + inline styles.
 * - connect-src 'self': AI (xAI), Web Push sends and DB calls all happen on the
 *   server; the browser only calls this origin (+ the banner's deployer API).
 * - worker-src 'self': /savia-sw.js. Push delivery into the SW is done by the
 *   browser's push service and is not subject to page CSP.
 * - Whop checkout / Zinli / YouTube are plain links (new tab): no frames needed.
 */
export const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://grok.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' data: blob:",
  "connect-src 'self' https://app-builder-deployer.grok.com",
  "worker-src 'self'",
  "manifest-src 'self'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

export const SECURITY_HEADERS: Readonly<Record<string, string>> = {
  "Content-Security-Policy": CSP,
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), serial=(), hid=(), midi=(), accelerometer=(), gyroscope=(), magnetometer=(), browsing-topics=()",
  "X-Content-Type-Options": "nosniff",
};
