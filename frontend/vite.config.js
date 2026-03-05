import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",   // expose on all interfaces so LAN devices can connect
    port: 5173,
    proxy: {
      "/process": "http://localhost:8000",
      "/reset":   "http://localhost:8000",
      "/health":  "http://localhost:8000",
    },
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
});
