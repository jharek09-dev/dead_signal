import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { rm } from "node:fs/promises";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

// The demo's background lives in public/ (the demo CSS loads it by URL), and vite
// copies public/ wholesale — so the dev-only demo's assets must be pruned post-build.
const dropDemoAssets = () => ({
  name: "drop-demo-assets",
  apply: "build",
  closeBundle: () => rm(resolve(rootDir, "dist/demo"), { recursive: true, force: true }),
});

export default defineConfig(({ command }) => ({
  // GitHub Pages serves the app from /dead_signal/; local dev stays at root so
  // `npm run dev` and the preview tooling are unaffected.
  base: command === "build" ? "/dead_signal/" : "/",
  plugins: [react(), dropDemoAssets()],
  // Honor an assigned PORT (preview tooling / CI); plain `npm run dev` keeps vite's default.
  server: process.env.PORT ? { port: Number(process.env.PORT), strictPort: true } : undefined,
  build: {
    rollupOptions: {
      input: {
        main: resolve(rootDir, "index.html"),
        // The browser demo is dev-only until it's ready to ship: `npm run dev` still
        // serves /demo.html, but the Pages build (and deploy) excludes it.
        // demo: resolve(rootDir, "demo.html"),
      },
    },
  },
}));
