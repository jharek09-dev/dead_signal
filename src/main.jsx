import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import DeadSignal from "./DeadSignal.jsx";

// ── window.storage shim ───────────────────────────────────────────────────────
// The game persists recovered memories via window.storage.{get,set,delete},
// an API provided by the Claude artifact sandbox. When running standalone we
// back it with localStorage so persistence still works. The shape mirrors the
// sandbox: get() resolves to { value } (or null), set/delete resolve to void.
if (typeof window !== "undefined" && !window.storage) {
  window.storage = {
    get: async (key) => {
      const value = localStorage.getItem(key);
      return value === null ? null : { value };
    },
    set: async (key, value) => { localStorage.setItem(key, value); },
    delete: async (key) => { localStorage.removeItem(key); },
  };
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <DeadSignal />
  </StrictMode>
);

// ── offline service worker ────────────────────────────────────────────────────
// PRD §8.5 — the installed PWA must run with the network disabled. `sw.js` is generated at
// build time by the offlinePrecache plugin (vite.config.js) and precaches the whole app,
// including the lazily-imported Tone.js chunk. Production only: a SW in dev would serve stale
// modules and fight Vite's HMR.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
      .catch(() => { /* offline support is additive — never block the game on it */ });
  });
}
