import type { CapacitorConfig } from '@capacitor/cli';

/**
 * MVP: load the live Vercel deployment in the WebView.
 * TanStack Start uses server functions; a local-only `dist` bundle would break APIs.
 * `webDir` is committed `www` so `cap sync` works without a Vite build (`dist` is gitignored).
 * Premium / Serena checkout stays on Whop + Zinli (see src/lib/pay-links.ts) — web only.
 */
const config: CapacitorConfig = {
  appId: 'app.savia.casa',
  appName: 'Savia',
  webDir: 'www',
  server: {
    url: 'https://savia-casa.vercel.app',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
