const PLAN = "/savia-remind-plan";

self.addEventListener("install", (e) => {
  e.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
});

function todayISO() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

async function readPlan() {
  const cache = await caches.open("savia-remind");
  const res = await cache.match(PLAN);
  if (!res) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function fire() {
  const plan = await readPlan();
  if (!plan || !Array.isArray(plan.items)) return;
  const today = todayISO();
  const hit = plan.items.find((x) => x.day === today);
  if (!hit) return;
  const key = `shown-${today}-${hit.kind || "day"}`;
  const cache = await caches.open("savia-remind");
  if (await cache.match("/" + key)) return;
  await cache.put("/" + key, new Response("1"));
  await self.registration.showNotification(hit.title, {
    body: hit.body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: `savia-${hit.kind || today}`,
    data: { url: "/app/hoy" },
  });
}

self.addEventListener("periodicsync", (e) => {
  if (e.tag === "savia-daily") e.waitUntil(fire());
});

self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "arm") e.waitUntil(fire());
});

// Web Push from the server (/api/cron/push, /api/push/test).
self.addEventListener("push", (e) => {
  let data = {};
  try {
    data = e.data ? e.data.json() : {};
  } catch {
    data = { body: e.data ? e.data.text() : "" };
  }
  const title = data.title || "Savia";
  e.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "¿Cómo va tu día?",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: data.tag || "savia-daily",
      renotify: false,
      data: { url: data.url || "/app/hoy" },
    }),
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const raw = (e.notification.data && e.notification.data.url) || "/app/hoy";
  const url = new URL(raw, self.location.origin);
  if (url.origin !== self.location.origin) url.href = new URL("/app/hoy", self.location.origin).href;
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const open = windows.find((c) => new URL(c.url).origin === self.location.origin);
      if (open) {
        return open.focus().then((c) => (c && "navigate" in c ? c.navigate(url.href) : c)).catch(() => self.clients.openWindow(url.href));
      }
      return self.clients.openWindow(url.href);
    }),
  );
});
