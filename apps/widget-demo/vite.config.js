import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        basic: resolve(__dirname, "examples/basic.html"),
        "content-gate": resolve(__dirname, "examples/content-gate.html"),
      },
    },
  },
  server: {
    port: 3000,
    host: "0.0.0.0",
  },
  preview: {
    port: process.env.PORT || 3000,
    host: "0.0.0.0",
    allowedHosts: ["static-sdk-content-gated-production.up.railway.app"],
  },
});
