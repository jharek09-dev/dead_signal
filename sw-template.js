// ─── Dead Signal — offline service worker ────────────────────────────────────
// PRD §8.5: the PWA must install AND run with the network disabled. The game makes zero network
// calls at play time, so "offline" is only a question of whether the shell and its chunks are in
// the cache. We precache everything the app can ever ask for — including the lazily-imported
// Tone.js chunk — so audio survives a cold offline launch too.
//
// The PRECACHE / SHELL / VERSION constants below are injected at build time by the `offlinePrecache`
// plugin in vite.config.js: asset filenames are content-hashed and can't be hardcoded here.
const VERSION  = "__VERSION__";
const CACHE    = `dead-signal-${VERSION}`;
const SHELL    = "__SHELL__";
const PRECACHE = __PRECACHE__;

// Install — pull the whole app into the cache, then take over immediately.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

// Activate — drop caches from previous builds, then claim open clients.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k.startsWith("dead-signal-") && k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch — cache-first. The game is fully static and deterministic, so a cache hit is always
// correct: it makes a dead network indistinguishable from a live one.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  if (new URL(request.url).origin !== self.location.origin) return;   // never touch cross-origin

  // Navigations — serve the cached shell so a cold offline launch still boots.
  if (request.mode === "navigate") {
    event.respondWith(
      caches.match(SHELL).then((hit) => hit || fetch(request).catch(() => caches.match(SHELL)))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((hit) => hit || fetch(request).then((res) => {
      if (res && res.ok && res.type === "basic") {          // defensive runtime cache
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(request, copy));
      }
      return res;
    }).catch(() => caches.match(SHELL)))
  );
});
