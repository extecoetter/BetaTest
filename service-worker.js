const CACHE_NAME = "orcamento-clima-beta-0-1-18";

const ASSETS = [
  "./",
  "./index.html",
  "./config.js",
  "./manifest.json",

  // Assets / libs (necessário pro PDF REAL e pro logo no PDF)
  "./assets/logo.png",
  "./libs/jspdf.umd.min.js",

  // (opcional) se ainda existir no seu projeto, não atrapalha
  "./libs/html2canvas.min.js",

  // Ícones
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Network-first para HTML (pegar updates do beta)
  if (req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")) {
    event.respondWith(
      fetch(req).then((res) => {
        // atualiza o cache do index quando online
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", copy)).catch(() => {});
        return res;
      }).catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Cache-first para assets/libs + runtime cache
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        // salva em cache para funcionar offline depois
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
        return res;
      });
    })
  );
});
