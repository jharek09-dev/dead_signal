import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

// Emit a precache service worker listing every built asset (names are content-hashed, so the
// list can only be known here). Gives the PWA the offline guarantee in PRD §8.5 with no runtime
// dependency and no third-party SW library.
const offlinePrecache = (base) => ({
  name: "dead-signal-offline-precache",
  apply: "build",
  generateBundle(_options, bundle) {
    const assets = Object.keys(bundle).map((f) => base + f);
    const statics = fs.readdirSync("public").filter((f) => !fs.statSync(path.join("public", f)).isDirectory());
    const precache = [...new Set([base, base + "index.html", ...assets, ...statics.map((f) => base + f)])];
    const version = crypto.createHash("sha256").update(precache.join("|")).digest("hex").slice(0, 12);

    const src = fs.readFileSync("sw-template.js", "utf8")
      .replaceAll("__PRECACHE__", JSON.stringify(precache, null, 2))
      .replaceAll("__SHELL__", base + "index.html")
      .replaceAll("__VERSION__", version);

    this.emitFile({ type: "asset", fileName: "sw.js", source: src });
  },
});

// Dead Signal — the game. Single entry: index.html → src/main.jsx → <DeadSignal/>.
// (The browser demo site was split out into its own repo, deadsignal_demo.)
export default defineConfig(({ command, isPreview }) => {
  // GitHub Pages serves the app from /dead_signal/; local dev stays at root so
  // `npm run dev` and the preview tooling are unaffected. `vite preview` runs as
  // command === "serve", so it needs isPreview to serve the built /dead_signal/
  // base faithfully — otherwise it serves at "/" and the SW (and every hashed
  // asset the built index.html points at) 404s to the SPA fallback.
  const base = command === "build" || isPreview ? "/dead_signal/" : "/";
  return {
    base,
    plugins: [react(), offlinePrecache(base)],
    // Honor an assigned PORT (preview tooling / CI); plain `npm run dev` keeps vite's default.
    server: process.env.PORT ? { port: Number(process.env.PORT), strictPort: true } : undefined,
  };
});
