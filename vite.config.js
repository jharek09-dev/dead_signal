import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dead Signal — the game. Single entry: index.html → src/main.jsx → <DeadSignal/>.
// (The browser demo site was split out into its own repo, deadsignal_demo.)
export default defineConfig(({ command }) => ({
  // GitHub Pages serves the app from /dead_signal/; local dev stays at root so
  // `npm run dev` and the preview tooling are unaffected.
  base: command === "build" ? "/dead_signal/" : "/",
  plugins: [react()],
  // Honor an assigned PORT (preview tooling / CI); plain `npm run dev` keeps vite's default.
  server: process.env.PORT ? { port: Number(process.env.PORT), strictPort: true } : undefined,
}));
