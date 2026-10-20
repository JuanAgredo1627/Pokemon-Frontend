const VERSION = "v2";
const SHELL = `shell-${VERSION}`, IMG = `img-${VERSION}`, API = `api-${VERSION}`;
const FILES = ["./", "index.html", "styles.css", "app.js", "api.js", "theme.js", "config.js", "manifest.webmanifest", "icons/icon.svg", "icons/icon-192.png"];

self.addEventListener("install", (e) => { e.waitUntil(caches.open(SHELL).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => ![SHELL, IMG, API].includes(k)).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET") return;
  if (url.pathname.startsWith("/api/")) {            // datos: red primero, caché como respaldo
    e.respondWith(fetch(req).then((r) => { if (r.ok) { const c = r.clone(); caches.open(API).then((x) => x.put(req, c)); } return r; }).catch(() => caches.match(req)));
  } else if (url.origin === location.origin) {       // app shell: red primero para no servir código viejo
    e.respondWith(fetch(req).then((r) => { if (r.ok) { const c = r.clone(); caches.open(SHELL).then((x) => x.put(req, c)); } return r; }).catch(() => caches.match(req)));
  } else if (req.destination === "image") {         // imágenes: caché y se refresca en segundo plano
    e.respondWith(caches.open(IMG).then(async (c) => {
      const hit = await c.match(req);
      const net = fetch(req).then((r) => { if (r.ok || r.type === "opaque") c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
  }
});
