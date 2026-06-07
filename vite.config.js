import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  // GitHub Pages serves the app from /dead_signal/; local dev stays at root so
  // `npm run dev` and the preview tooling are unaffected.
  base: command === "build" ? "/dead_signal/" : "/",
  plugins: [react()],
}));
