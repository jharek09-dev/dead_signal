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
