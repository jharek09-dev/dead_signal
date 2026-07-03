import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(({ command }) => ({
  // GitHub Pages serves the app from /dead_signal/; local dev stays at root so
  // `npm run dev` and the preview tooling are unaffected.
  base: command === "build" ? "/dead_signal/" : "/",
  plugins: [react()],
  // Honor an assigned PORT (preview tooling / CI); plain `npm run dev` keeps vite's default.
  server: process.env.PORT ? { port: Number(process.env.PORT), strictPort: true } : undefined,
  build: {
    rollupOptions: {
      input: {
        main: resolve(rootDir, "index.html"),
        demo: resolve(rootDir, "demo.html"),
      },
    },
  },
}));
