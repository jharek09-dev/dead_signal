import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import BrowserDemo from "./BrowserDemo.jsx";

const DEMO_PREFIX = "ds_demo_";

if (typeof window !== "undefined" && !window.storage) {
  window.storage = {
    get: async (key) => {
      const value = localStorage.getItem(`${DEMO_PREFIX}${key}`);
      return value === null ? null : { value };
    },
    set: async (key, value) => { localStorage.setItem(`${DEMO_PREFIX}${key}`, value); },
    delete: async (key) => { localStorage.removeItem(`${DEMO_PREFIX}${key}`); },
  };
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserDemo />
  </StrictMode>
);
