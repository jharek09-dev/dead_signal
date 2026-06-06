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

// ── API endpoint ──────────────────────────────────────────────────────────────
// VITE_API_URL points the game at a proxied path (see vite.config.js) so the
// Anthropic API key can be injected server-side rather than shipped to the
// browser. If unset, the game falls back to calling api.anthropic.com directly,
// which only works inside the Claude artifact sandbox.
if (typeof window !== "undefined" && import.meta.env.VITE_API_URL) {
  window.__DS_API_URL__ = import.meta.env.VITE_API_URL;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <DeadSignal />
  </StrictMode>
);
