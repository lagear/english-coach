import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

// Load mkcert-generated certificates if present
// Generate them once with:
//   mkcert -install
//   mkcert coach.local 192.168.x.x localhost 127.0.0.1
// Then rename outputs to coach.local.pem and coach.local-key.pem
const certDir = path.resolve(__dirname, "../certs");
const certFile = path.join(certDir, "coach.local.pem");
const keyFile  = path.join(certDir, "coach.local-key.pem");
const hasCerts = fs.existsSync(certFile) && fs.existsSync(keyFile);

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",   // expose on all interfaces so LAN devices can connect
    port: 5173,
    https: hasCerts
      ? { cert: fs.readFileSync(certFile), key: fs.readFileSync(keyFile) }
      : false,         // falls back to plain http if certs not generated yet
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
