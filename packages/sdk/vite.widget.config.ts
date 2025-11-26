// @ts-nocheck
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "bundles/widget",
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, "src/widget/index.tsx"),
      name: "B3Widget",
      formats: ["iife"],
      fileName: () => "b3-widget.js",
    },
    minify: false,
    sourcemap: false,
  },
  resolve: {
    alias: {
      "@b3dotfun/sdk": resolve(__dirname, "src"),
    },
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    "process.env": "{}",
    global: "globalThis",
  },
});
