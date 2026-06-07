import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Dead Signal calls the Anthropic Messages API from the browser. Shipping an
// API key to the client is unsafe, so in local dev we expose a same-origin
// path (/api/messages) that Vite proxies to api.anthropic.com, injecting the
// key and required headers server-side. Set VITE_API_URL=/api/messages and
// ANTHROPIC_API_KEY in your .env to use it (see .env.example).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api/messages": {
          target: "https://api.anthropic.com",
          changeOrigin: true,
          rewrite: () => "/v1/messages",
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              if (env.ANTHROPIC_API_KEY) proxyReq.setHeader("x-api-key", env.ANTHROPIC_API_KEY);
              proxyReq.setHeader("anthropic-version", "2023-06-01");
              // This is a server-side proxy, not a real browser call. Drop the
              // browser Origin/Referer (otherwise Anthropic treats it as a CORS
              // request and 401s) and mark it as an allowed direct caller.
              proxyReq.removeHeader("origin");
              proxyReq.removeHeader("referer");
              proxyReq.setHeader("anthropic-dangerous-direct-browser-access", "true");
            });
          },
        },
      },
    },
  };
});
