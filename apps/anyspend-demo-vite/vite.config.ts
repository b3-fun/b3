import { viteCommonjs } from "@originjs/vite-plugin-commonjs";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), nodePolyfills(), viteCommonjs()],
  define: {
    "process.env": {
      NEXT_PUBLIC_THIRDWEB_CLIENT_ID: "f393c7eb287696dc4db76d980cc68328",
      NEXT_PUBLIC_THIRDWEB_ECOSYSTEM_ID: "ecosystem.b3-open-gaming",
    },
  },
  resolve: {
    alias: {
      "@b3dotfun/sdk/index.css": path.resolve(__dirname, "../../packages/sdk/dist/styles/index.css"),
      "@b3dotfun/sdk": path.resolve(__dirname, "../../packages/sdk/src"),
    },
  },
});
