# Savia Android (Capacitor)

Free native shell. Premium / Serena stays on the web (Whop + Zinli in `src/lib/pay-links.ts`).

## Why `server.url` (remote WebView)

The Android app loads **https://savia-casa.vercel.app** inside the Capacitor WebView.

Reasons for MVP:

- TanStack Start relies on **server functions**; a static `dist`-only package would break AI and other APIs.
- One deploy (Vercel) powers web + app; no duplicate release for every UI fix.
- Payments already open Whop/Zinli URLs in the browser — unchanged.

`webDir: www` is a minimal placeholder so `npx cap sync` works. Do not treat local `www` as the production app content while `server.url` is set.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run cap:sync` | Sync Capacitor config + web assets into `android/` |
| `npm run android:open` | Open the project in Android Studio (requires Studio + SDK) |

## Build a release AAB (Play Console)

This CI/agent box often has no JDK / Android SDK. On a machine with **Android Studio**:

1. `npm ci && npm run cap:sync`
2. Open Android Studio → **File → Open** → `android/`
3. **Build → Generate Signed Bundle / APK** → Android App Bundle
4. Use your Play upload keystore (create one if first upload)
5. Upload the `.aab` in Play Console (Internal testing → Production)

Optional CLI (with `ANDROID_HOME` + JDK 17+):

```bash
cd android && ./gradlew bundleRelease
# output: android/app/build/outputs/bundle/release/app-release.aab
```

## Product rules

- App listing: **free** wrapper.
- Do **not** add Play Billing for Serena; keep Whop/Zinli web checkouts.
- Do not bake secrets (`XAI_API_KEY`, etc.) into the Android project.
